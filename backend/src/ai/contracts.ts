/**
 * FC-AI-01 (PROPOSED) — عقود LLM Gateway.
 * لا تعتمد على أي مزود أو مكتبة. المزودون الحقيقيون ينفذون LlmProvider فقط.
 * قاعدة حاكمة: ناتج النموذج نص أو JSON مقترح؛ لا يحمل أبدًا أمر تنفيذ. أي تغيير في الحالة
 * يمر عبر النواة (FleetService) بعد تأكيد الكابتن صراحة.
 */

/** الغرض يحدد فئة البيانات المسموح إرسالها والميزانية. قائمة مغلقة. */
export const PURPOSES = ['voice_understanding', 'insights_summary', 'expense_classification'] as const;
export type Purpose = (typeof PURPOSES)[number];

export type Role = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  readonly role: Role;
  readonly content: string;
}

export interface LlmRequest {
  readonly requestId: string;
  readonly purpose: Purpose;
  readonly messages: readonly ChatMessage[];
  /** سقف إلزامي لمخرجات النموذج؛ يُقصّ إلى سقف الغرض في الإعدادات. */
  readonly maxOutputTokens: number;
  readonly responseFormat: 'text' | 'json';
  /** مهلة الطلب كاملًا بالميلي ثانية، تشمل كل المحاولات. */
  readonly timeoutMs: number;
}

export type FinishReason = 'stop' | 'length' | 'content_filter';

export interface Usage {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

/** ما يعيده المزود الخام. */
export interface ProviderResult {
  readonly text: string;
  readonly finishReason: FinishReason;
  readonly usage: Usage;
  readonly model: string;
}

/** ما يعيده الـGateway للمستهلك. لا يوجد حقل action عمدًا. */
export interface LlmResponse extends ProviderResult {
  readonly requestId: string;
  readonly provider: string;
  readonly latencyMs: number;
  /** المزودون الذين فشلوا قبل النجاح، للتشخيص. */
  readonly attempts: readonly AttemptRecord[];
}

export interface AttemptRecord {
  readonly provider: string;
  readonly outcome: 'ok' | LlmErrorCode;
}

export const LLM_ERROR_CODES = [
  'DISABLED', // الـGateway أو الغرض مغلق (الافتراضي)
  'BUDGET_EXCEEDED',
  'BAD_REQUEST', // طلب غير صالح؛ لا إعادة محاولة
  'AUTH_FAILED', // مفتاح خاطئ/منتهٍ؛ يفتح الدائرة للمزود
  'RATE_LIMITED',
  'TIMEOUT',
  'PROVIDER_UNAVAILABLE',
  'CONTENT_FILTERED',
  'INVALID_OUTPUT', // JSON مطلوب وفشل التحليل، أو ناتج فارغ
  'ALL_PROVIDERS_FAILED',
] as const;
export type LlmErrorCode = (typeof LLM_ERROR_CODES)[number];

/** يُرمى من المزودين ومن الـGateway. لا يحمل نص الطلب ولا الرد أبدًا. */
export class LlmError extends Error {
  readonly code: LlmErrorCode;
  readonly attempts: readonly AttemptRecord[];
  constructor(code: LlmErrorCode, message: string, attempts: readonly AttemptRecord[] = []) {
    super(message);
    this.name = 'LlmError';
    this.code = code;
    this.attempts = attempts;
  }
}

/** أخطاء تستدعي تجربة المزود التالي. BAD_REQUEST وCONTENT_FILTERED لا تُجرَّب على غيره. */
export const FALLBACK_CODES: ReadonlySet<LlmErrorCode> = new Set<LlmErrorCode>([
  'AUTH_FAILED',
  'RATE_LIMITED',
  'TIMEOUT',
  'PROVIDER_UNAVAILABLE',
]);

export interface ProviderCapabilities {
  readonly json: boolean;
  readonly maxContextTokens: number;
}

/**
 * عقد المزود. شروط التوافق (Conformance) في docs/ai/LLM_PROVIDER_CONTRACT_AR.md:
 * - يلتزم بـsignal.aborted ويرمي TIMEOUT.
 * - يُحوّل كل أخطاء المنقل إلى LlmError بالرموز أعلاه، ولا يُسرّب نص الرد ولا المفتاح.
 * - لا يعيد المحاولة داخليًا (الـGateway وحده يقرر).
 * - لا يسجّل المحتوى.
 */
export interface LlmProvider {
  readonly id: string;
  readonly capabilities: ProviderCapabilities;
  complete(
    req: Pick<LlmRequest, 'messages' | 'maxOutputTokens' | 'responseFormat'>,
    signal: AbortSignal,
  ): Promise<ProviderResult>;
}

export interface PurposePolicy {
  readonly enabled: boolean;
  /** ترتيب الأولوية؛ أول مزود هو الأساسي. */
  readonly providers: readonly string[];
  readonly maxOutputTokens: number;
  readonly maxInputChars: number;
}

export interface BudgetPolicy {
  /** 0 = لا شيء مسموح. الافتراضي صفر حتى يعتمد MOSAAB. */
  readonly maxRequestsPerDay: number;
  readonly maxTokensPerDay: number;
}

export interface GatewayConfig {
  readonly enabled: boolean;
  readonly purposes: Readonly<Record<Purpose, PurposePolicy>>;
  readonly budget: BudgetPolicy;
  /** عدد الإخفاقات المتتالية التي تفتح الدائرة، ومدة الفتح. */
  readonly breaker: { readonly failures: number; readonly cooldownMs: number };
}

/** حدث تدقيق: بيانات وصفية فقط، لا محتوى. */
export interface AuditEvent {
  readonly at: string;
  readonly requestId: string;
  readonly purpose: Purpose;
  readonly provider: string | null;
  readonly outcome: 'ok' | LlmErrorCode;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly latencyMs: number;
  readonly redactions: number;
}

export interface AuditSink {
  record(event: AuditEvent): void;
}

/** حالة الميزانية اليومية. تُحفظ لتصمد أمام إعادة تشغيل الخادم (فجوة 1 في وثيقة التصميم). */
export interface BudgetState {
  readonly day: string;
  readonly requests: number;
  readonly tokens: number;
}

/** تخزين متزامن عن قصد (نواة نقية). محوّل قاعدة البيانات يأتي مع DEC-08. */
export interface BudgetStore {
  load(): BudgetState | null;
  save(state: BudgetState): void;
}

export class MemoryBudgetStore implements BudgetStore {
  #state: BudgetState | null = null;
  load(): BudgetState | null {
    return this.#state;
  }
  save(state: BudgetState): void {
    this.#state = state;
  }
}

/** الإعداد الآمن الافتراضي: كل شيء مغلق وميزانية صفر. */
export const SAFE_DEFAULT_CONFIG: GatewayConfig = {
  enabled: false,
  purposes: {
    voice_understanding: { enabled: false, providers: [], maxOutputTokens: 256, maxInputChars: 1000 },
    insights_summary: { enabled: false, providers: [], maxOutputTokens: 512, maxInputChars: 4000 },
    expense_classification: { enabled: false, providers: [], maxOutputTokens: 64, maxInputChars: 500 },
  },
  budget: { maxRequestsPerDay: 0, maxTokensPerDay: 0 },
  breaker: { failures: 3, cooldownMs: 60_000 },
};
