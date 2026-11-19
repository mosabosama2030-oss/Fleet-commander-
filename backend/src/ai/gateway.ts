import { operatingDate } from '../domain/time.ts';
import type { Clock } from '../domain/time.ts';
import { redact } from './redact.ts';
import { FALLBACK_CODES, LlmError } from './contracts.ts';
import type {
  AttemptRecord,
  AuditSink,
  BudgetStore,
  ChatMessage,
  GatewayConfig,
  LlmErrorCode,
  LlmProvider,
  LlmRequest,
  LlmResponse,
  ProviderResult,
} from './contracts.ts';

export interface GatewayDeps {
  readonly config: GatewayConfig;
  readonly providers: Readonly<Record<string, LlmProvider>>;
  readonly clock: Clock;
  readonly audit?: AuditSink;
  /** اختياري؛ بدونه تُصفَّر الميزانية عند إعادة التشغيل (غير مقبول قبل أي تفعيل حقيقي). */
  readonly budgetStore?: BudgetStore;
}

const MAX_TIMEOUT_MS = 60_000;

interface Breaker {
  failures: number;
  openUntil: number;
}

/**
 * FC-AI-01 (PROPOSED): نقطة العبور الوحيدة إلى أي نموذج لغوي.
 * مغلق افتراضيًا، ميزانية يومية صلبة، تنقيح قبل الإرسال، تجاوز مزود عند الأعطال القابلة،
 * ولا يعيد أمر تنفيذ أبدًا.
 */
export class LlmGateway {
  readonly #d: GatewayDeps;
  readonly #breakers = new Map<string, Breaker>();
  #day = '';
  #requests = 0;
  #tokens = 0;

  constructor(deps: GatewayDeps) {
    this.#d = deps;
    const saved = deps.budgetStore?.load();
    if (saved) {
      this.#day = saved.day;
      this.#requests = saved.requests;
      this.#tokens = saved.tokens;
    }
  }

  async complete(req: LlmRequest): Promise<LlmResponse> {
    const started = this.#d.clock.now().getTime();
    const attempts: AttemptRecord[] = [];
    let redactions = 0;
    let used: { provider: string; inputTokens: number; outputTokens: number } | null = null;
    try {
      const policy = this.#d.config.purposes[req.purpose];
      if (!this.#d.config.enabled || !policy || !policy.enabled) {
        throw new LlmError('DISABLED', 'LLM gateway is disabled for this purpose');
      }
      this.#validate(req, policy.maxInputChars);

      const messages: ChatMessage[] = req.messages.map((m) => {
        const r = redact(m.content);
        redactions += r.count;
        return { role: m.role, content: r.text };
      });
      const inputChars = messages.reduce((n, m) => n + m.content.length, 0);
      const maxOut = Math.min(req.maxOutputTokens, policy.maxOutputTokens);
      // تقدير محافظ: حرف عربي ≈ توكن واحد في أسوأ الحالات.
      const estimate = inputChars + maxOut;
      const deadline = started + req.timeoutMs;

      for (const id of policy.providers) {
        if (this.#d.clock.now().getTime() >= deadline) break;
        const provider = this.#d.providers[id];
        if (!provider || (req.responseFormat === 'json' && !provider.capabilities.json)) {
          attempts.push({ provider: id, outcome: 'PROVIDER_UNAVAILABLE' });
          continue;
        }
        if (this.#isOpen(id)) {
          attempts.push({ provider: id, outcome: 'PROVIDER_UNAVAILABLE' });
          continue;
        }
        this.#reserve(estimate);
        try {
          const raw = await this.#callWithTimeout(provider, messages, maxOut, req, deadline);
          const result = this.#checkOutput(raw, req);
          this.#reconcile(estimate, result.usage.inputTokens + result.usage.outputTokens);
          this.#breakers.delete(id);
          attempts.push({ provider: id, outcome: 'ok' });
          used = { provider: id, ...result.usage };
          return {
            ...result,
            requestId: req.requestId,
            provider: id,
            latencyMs: this.#d.clock.now().getTime() - started,
            attempts,
          };
        } catch (e) {
          const code = toCode(e);
          // الإخفاق في الشبكة/المصادقة لم يُحاسَب عليه؛ ناتج مرفوض (فلترة/JSON خاطئ) حوسب على الأرجح.
          if (code !== 'INVALID_OUTPUT' && code !== 'CONTENT_FILTERED') this.#reconcile(estimate, 0);
          attempts.push({ provider: id, outcome: code });
          if (code === 'CONTENT_FILTERED' || code === 'BAD_REQUEST') {
            throw new LlmError(code, `provider ${id} rejected the request`, attempts);
          }
          if (FALLBACK_CODES.has(code) || code === 'INVALID_OUTPUT') this.#fail(id);
        }
      }
      throw new LlmError('ALL_PROVIDERS_FAILED', 'no provider produced a valid answer', attempts);
    } catch (e) {
      const err = e instanceof LlmError ? e : new LlmError('PROVIDER_UNAVAILABLE', 'unexpected gateway failure', attempts);
      this.#emit(req, null, err.code, 0, 0, started, redactions);
      throw err;
    } finally {
      if (used) this.#emit(req, used.provider, 'ok', used.inputTokens, used.outputTokens, started, redactions);
    }
  }

  #validate(req: LlmRequest, maxInputChars: number): void {
    const bad = (m: string): never => {
      throw new LlmError('BAD_REQUEST', m);
    };
    if (typeof req.requestId !== 'string' || req.requestId.length === 0) bad('requestId is required');
    if (!Array.isArray(req.messages) || req.messages.length === 0) bad('messages must not be empty');
    if (!req.messages.every((m) => typeof m.content === 'string' && ['system', 'user', 'assistant'].includes(m.role))) {
      bad('invalid message');
    }
    if (!Number.isInteger(req.maxOutputTokens) || req.maxOutputTokens < 1) bad('maxOutputTokens must be a positive integer');
    if (!Number.isInteger(req.timeoutMs) || req.timeoutMs < 1 || req.timeoutMs > MAX_TIMEOUT_MS) {
      bad(`timeoutMs must be an integer in 1..${MAX_TIMEOUT_MS}`);
    }
    if (req.responseFormat !== 'text' && req.responseFormat !== 'json') bad('responseFormat must be text or json');
    const chars = req.messages.reduce((n, m) => n + m.content.length, 0);
    if (chars > maxInputChars) bad('input exceeds the purpose limit');
  }

  async #callWithTimeout(
    provider: LlmProvider,
    messages: readonly ChatMessage[],
    maxOutputTokens: number,
    req: LlmRequest,
    deadline: number,
  ): Promise<ProviderResult> {
    const remaining = Math.max(1, deadline - this.#d.clock.now().getTime());
    const ctl = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        ctl.abort();
        reject(new LlmError('TIMEOUT', 'provider timed out'));
      }, remaining);
    });
    try {
      return await Promise.race([
        provider.complete({ messages, maxOutputTokens, responseFormat: req.responseFormat }, ctl.signal),
        timeout,
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  #checkOutput(r: ProviderResult, req: LlmRequest): ProviderResult {
    if (r.finishReason === 'content_filter') throw new LlmError('CONTENT_FILTERED', 'filtered');
    if (typeof r.text !== 'string' || r.text.trim() === '') throw new LlmError('INVALID_OUTPUT', 'empty output');
    if (req.responseFormat === 'json') {
      try {
        JSON.parse(r.text);
      } catch {
        throw new LlmError('INVALID_OUTPUT', 'output is not valid JSON');
      }
    }
    return r;
  }

  #rollDay(): void {
    const day = operatingDate(this.#d.clock.now());
    if (day !== this.#day) {
      this.#day = day;
      this.#requests = 0;
      this.#tokens = 0;
    }
  }

  #reserve(estimate: number): void {
    this.#rollDay();
    const b = this.#d.config.budget;
    if (this.#requests + 1 > b.maxRequestsPerDay || this.#tokens + estimate > b.maxTokensPerDay) {
      throw new LlmError('BUDGET_EXCEEDED', 'daily LLM budget exhausted');
    }
    this.#requests += 1;
    this.#tokens += estimate;
    try {
      this.#persist();
    } catch {
      // فشل الحفظ ⇒ نتراجع ونغلق: لا نستدعي مزودًا بميزانية لا تُحفظ.
      this.#requests -= 1;
      this.#tokens -= estimate;
      throw new LlmError('BUDGET_EXCEEDED', 'budget store unavailable');
    }
  }

  /** يستبدل التقدير بالفعلي؛ الطلب يبقى محسوبًا حتى لو فشل (قد يكون المزود حاسبه). */
  #reconcile(estimate: number, actual: number): void {
    this.#tokens = Math.max(0, this.#tokens - estimate + actual);
    try {
      this.#persist();
    } catch {
      // المخزّن يبقى على القيمة الأعلى (المحافظة). فشل الحفظ هنا لا يحوّل نجاحًا إلى fallback.
    }
  }

  #persist(): void {
    this.#d.budgetStore?.save({ day: this.#day, requests: this.#requests, tokens: this.#tokens });
  }

  #isOpen(id: string): boolean {
    const b = this.#breakers.get(id);
    return !!b && b.openUntil > this.#d.clock.now().getTime();
  }

  #fail(id: string): void {
    const b = this.#breakers.get(id) ?? { failures: 0, openUntil: 0 };
    b.failures += 1;
    if (b.failures >= this.#d.config.breaker.failures) {
      b.openUntil = this.#d.clock.now().getTime() + this.#d.config.breaker.cooldownMs;
      b.failures = 0;
    }
    this.#breakers.set(id, b);
  }

  #emit(
    req: LlmRequest,
    provider: string | null,
    outcome: 'ok' | LlmErrorCode,
    inputTokens: number,
    outputTokens: number,
    started: number,
    redactions: number,
  ): void {
    this.#d.audit?.record({
      at: this.#d.clock.now().toISOString(),
      requestId: req.requestId,
      purpose: req.purpose,
      provider,
      outcome,
      inputTokens,
      outputTokens,
      latencyMs: this.#d.clock.now().getTime() - started,
      redactions,
    });
  }
}

function toCode(e: unknown): LlmErrorCode {
  return e instanceof LlmError ? e.code : 'PROVIDER_UNAVAILABLE';
}
