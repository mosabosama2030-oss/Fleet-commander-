import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LlmGateway, LlmError, SAFE_DEFAULT_CONFIG, redact } from '../src/index.ts';
import type { AuditSink, BudgetStore, GatewayConfig, LlmProvider, LlmRequest, ProviderResult } from '../src/index.ts';

type Behavior = (signal: AbortSignal, calls: number) => Promise<ProviderResult>;

function ok(text = 'hello', input = 10, output = 5): ProviderResult {
  return { text, finishReason: 'stop', usage: { inputTokens: input, outputTokens: output }, model: 'm' };
}

function fake(id: string, behavior: Behavior, json = true): LlmProvider & { calls: number; lastMessages: unknown } {
  const p = {
    id,
    calls: 0,
    lastMessages: undefined as unknown,
    capabilities: { json, maxContextTokens: 8000 },
    complete(req: { messages: unknown }, signal: AbortSignal) {
      p.calls += 1;
      p.lastMessages = req.messages;
      return behavior(signal, p.calls);
    },
  };
  return p;
}

const fail = (code: ConstructorParameters<typeof LlmError>[0]): Behavior => () => Promise.reject(new LlmError(code, 'x'));

function cfg(over: Partial<GatewayConfig> = {}, providers = ['a', 'b']): GatewayConfig {
  return {
    ...SAFE_DEFAULT_CONFIG,
    enabled: true,
    purposes: {
      ...SAFE_DEFAULT_CONFIG.purposes,
      voice_understanding: { enabled: true, providers, maxOutputTokens: 100, maxInputChars: 200 },
    },
    budget: { maxRequestsPerDay: 10, maxTokensPerDay: 100000 },
    ...over,
  };
}

function setup(providers: LlmProvider[], config = cfg(), start = '2026-11-18T10:00:00Z') {
  let t = new Date(start).getTime();
  const events: unknown[] = [];
  const audit: AuditSink = { record: (e) => void events.push(e) };
  const clock = { now: () => new Date(t) };
  const gw = new LlmGateway({
    config,
    providers: Object.fromEntries(providers.map((p) => [p.id, p])),
    clock,
    audit,
  });
  return { gw, events, advance: (ms: number) => void (t += ms) };
}

const req = (over: Partial<LlmRequest> = {}): LlmRequest => ({
  requestId: 'r1',
  purpose: 'voice_understanding',
  messages: [{ role: 'user', content: 'hi' }],
  maxOutputTokens: 50,
  responseFormat: 'text',
  timeoutMs: 1000,
  ...over,
});

async function codeOf(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    return e instanceof LlmError ? e.code : `other:${String(e)}`;
  }
  return 'none';
}

describe('safe defaults and validation', () => {
  it('is DISABLED by default and never calls a provider', async () => {
    const a = fake('a', async () => ok());
    const { gw } = setup([a], SAFE_DEFAULT_CONFIG);
    assert.equal(await codeOf(gw.complete(req())), 'DISABLED');
    assert.equal(a.calls, 0);
  });
  it('is DISABLED when the purpose is off even if the gateway is on', async () => {
    const a = fake('a', async () => ok());
    const { gw } = setup([a], cfg());
    assert.equal(await codeOf(gw.complete(req({ purpose: 'insights_summary' }))), 'DISABLED');
  });
  it('zero budget blocks everything', async () => {
    const a = fake('a', async () => ok());
    const { gw } = setup([a], cfg({ budget: { maxRequestsPerDay: 0, maxTokensPerDay: 0 } }));
    assert.equal(await codeOf(gw.complete(req())), 'BUDGET_EXCEEDED');
    assert.equal(a.calls, 0);
  });
  it('rejects malformed requests with BAD_REQUEST before any provider call', async () => {
    const a = fake('a', async () => ok());
    const { gw } = setup([a]);
    const bads: Partial<LlmRequest>[] = [
      { requestId: '' },
      { messages: [] },
      { maxOutputTokens: 0 },
      { maxOutputTokens: 1.5 },
      { timeoutMs: 0 },
      { timeoutMs: 60001 },
      { responseFormat: 'xml' as never },
      { messages: [{ role: 'user', content: 'x'.repeat(201) }] },
      { messages: [{ role: 'tool' as never, content: 'x' }] },
    ];
    for (const b of bads) assert.equal(await codeOf(gw.complete(req(b))), 'BAD_REQUEST', JSON.stringify(b).slice(0, 40));
    assert.equal(a.calls, 0);
  });
});

describe('routing and fallback', () => {
  it('uses the first provider and returns metadata without any action field', async () => {
    const a = fake('a', async () => ok('hi'));
    const b = fake('b', async () => ok('other'));
    const { gw } = setup([a, b]);
    const r = await gw.complete(req());
    assert.equal(r.provider, 'a');
    assert.equal(r.text, 'hi');
    assert.equal(b.calls, 0);
    assert.equal('action' in r, false);
  });
  it('falls back on TIMEOUT/RATE_LIMITED/UNAVAILABLE/AUTH_FAILED and records attempts', async () => {
    for (const code of ['TIMEOUT', 'RATE_LIMITED', 'PROVIDER_UNAVAILABLE', 'AUTH_FAILED'] as const) {
      const a = fake('a', fail(code));
      const b = fake('b', async () => ok('from b'));
      const { gw } = setup([a, b]);
      const r = await gw.complete(req());
      assert.equal(r.provider, 'b', code);
      assert.deepEqual(r.attempts, [
        { provider: 'a', outcome: code },
        { provider: 'b', outcome: 'ok' },
      ]);
    }
  });
  it('does not fall back on BAD_REQUEST or CONTENT_FILTERED', async () => {
    for (const code of ['BAD_REQUEST', 'CONTENT_FILTERED'] as const) {
      const a = fake('a', fail(code));
      const b = fake('b', async () => ok());
      const { gw } = setup([a, b]);
      assert.equal(await codeOf(gw.complete(req())), code);
      assert.equal(b.calls, 0, code);
    }
  });
  it('treats a filtered finishReason as CONTENT_FILTERED without fallback', async () => {
    const a = fake('a', async () => ({ ...ok(), finishReason: 'content_filter' as const }));
    const b = fake('b', async () => ok());
    const { gw } = setup([a, b]);
    assert.equal(await codeOf(gw.complete(req())), 'CONTENT_FILTERED');
    assert.equal(b.calls, 0);
  });
  it('maps non-LlmError throws to PROVIDER_UNAVAILABLE without leaking the message', async () => {
    const a = fake('a', () => Promise.reject(new TypeError('sk-secret-key leaked')));
    const { gw } = setup([a], cfg({}, ['a']));
    try {
      await gw.complete(req());
      assert.fail('should throw');
    } catch (e) {
      assert.ok(e instanceof LlmError);
      assert.equal(e.code, 'ALL_PROVIDERS_FAILED');
      assert.equal(e.message.includes('sk-secret'), false);
    }
  });
  it('ALL_PROVIDERS_FAILED lists every attempt; unknown provider ids are skipped', async () => {
    const a = fake('a', fail('TIMEOUT'));
    const { gw } = setup([a], cfg({}, ['ghost', 'a']));
    try {
      await gw.complete(req());
      assert.fail('should throw');
    } catch (e) {
      assert.ok(e instanceof LlmError);
      assert.equal(e.code, 'ALL_PROVIDERS_FAILED');
      assert.deepEqual(e.attempts, [
        { provider: 'ghost', outcome: 'PROVIDER_UNAVAILABLE' },
        { provider: 'a', outcome: 'TIMEOUT' },
      ]);
    }
  });
  it('enforces the timeout, aborts the provider signal and falls back', async () => {
    let aborted = false;
    const slow = fake('a', (signal) => new Promise((_, rej) => signal.addEventListener('abort', () => { aborted = true; rej(new Error('aborted')); }, { once: true })));
    const b = fake('b', async () => ok());
    const { gw } = setup([slow, b]);
    const r = await gw.complete(req({ timeoutMs: 30 }));
    // الموعد النهائي يشمل كل المحاولات؛ الساعة الوهمية لا تتقدم فيبقى وقت لـb.
    assert.equal(aborted, true);
    assert.equal(r.provider, 'b');
  });
});

describe('JSON output', () => {
  it('skips providers without json capability', async () => {
    const a = fake('a', async () => ok('{"x":1}'), false);
    const b = fake('b', async () => ok('{"x":2}'));
    const { gw } = setup([a, b]);
    const r = await gw.complete(req({ responseFormat: 'json' }));
    assert.equal(r.provider, 'b');
    assert.equal(a.calls, 0);
  });
  it('treats invalid JSON and empty output as INVALID_OUTPUT and falls back', async () => {
    const a = fake('a', async () => ok('not json'));
    const b = fake('b', async () => ok('{"x":1}'));
    const { gw } = setup([a, b]);
    const r = await gw.complete(req({ responseFormat: 'json' }));
    assert.equal(r.provider, 'b');
    assert.equal(r.attempts[0]?.outcome, 'INVALID_OUTPUT');

    const e = fake('a', async () => ok('   '));
    const { gw: gw2 } = setup([e], cfg({}, ['a']));
    assert.equal(await codeOf(gw2.complete(req())), 'ALL_PROVIDERS_FAILED');
  });
});

describe('redaction before leaving the server', () => {
  it('redacts email, phone, long digit runs, coordinates and Arabic-Indic digits', () => {
    const r = redact('mail a.b@x.com tel +20 100 123 4567 id 29801011234567 at 30.0444, 31.2357 و ٠١٠٠١٢٣٤٥٦٧٨');
    assert.equal(/a\.b@x\.com|1234567|30\.0444/.test(r.text), false, r.text);
    assert.equal(r.count >= 4, true);
  });
  it('keeps ordinary small numbers (fares, km) intact', () => {
    assert.equal(redact('fare 85 km 12500 trips 7').text, 'fare 85 km 12500 trips 7');
    assert.equal(redact('fare 85 km 12500 trips 7').count, 0);
  });
  it('the provider only ever sees redacted text and the audit counts redactions', async () => {
    const a = fake('a', async () => ok());
    const { gw, events } = setup([a], cfg({}, ['a']));
    await gw.complete(req({ messages: [{ role: 'user', content: 'call 01001234567' }] }));
    const seen = JSON.stringify(a.lastMessages);
    assert.equal(seen.includes('01001234567'), false);
    assert.equal((events[0] as { redactions: number }).redactions, 1);
  });
});

describe('budget', () => {
  it('stops after maxRequestsPerDay and resets on the next Cairo day', async () => {
    const a = fake('a', async () => ok());
    const { gw, advance } = setup([a], cfg({ budget: { maxRequestsPerDay: 2, maxTokensPerDay: 100000 } }), '2026-11-18T10:00:00Z');
    await gw.complete(req());
    await gw.complete(req());
    assert.equal(await codeOf(gw.complete(req())), 'BUDGET_EXCEEDED');
    advance(24 * 3600 * 1000);
    await gw.complete(req());
    assert.equal(a.calls, 3);
  });
  it('stops on token budget using the conservative estimate', async () => {
    const a = fake('a', async () => ok('x', 1, 1));
    const { gw } = setup([a], cfg({ budget: { maxRequestsPerDay: 100, maxTokensPerDay: 100 } }));
    // تقدير 52 لكل طلب يتسع تحت 100، وبعد التسوية يبقى الفعلي (2) فقط.
    for (let i = 0; i < 5; i++) await gw.complete(req());
    const big = req({ maxOutputTokens: 100 });
    // 2 + 100 = 102 يتجاوز 100 وحده.
    assert.equal(await codeOf(gw.complete(big)), 'BUDGET_EXCEEDED');
  });
  it('does not charge tokens for a network failure but still counts the request', async () => {
    const a = fake('a', fail('TIMEOUT'));
    const { gw } = setup([a], cfg({ budget: { maxRequestsPerDay: 2, maxTokensPerDay: 100000 } }, ['a']));
    await codeOf(gw.complete(req()));
    await codeOf(gw.complete(req()));
    assert.equal(await codeOf(gw.complete(req())), 'BUDGET_EXCEEDED');
  });
  it('clamps maxOutputTokens to the purpose cap', async () => {
    let seen = 0;
    const p = { id: 'a', capabilities: { json: true, maxContextTokens: 1 }, complete: async (r: { maxOutputTokens: number }) => { seen = r.maxOutputTokens; return ok(); } };
    const { gw } = setup([p as LlmProvider], cfg({}, ['a']));
    await gw.complete(req({ maxOutputTokens: 5000 }));
    assert.equal(seen, 100);
  });
});

describe('circuit breaker', () => {
  it('opens after N consecutive failures, skips the provider, then closes after cooldown', async () => {
    const a = fake('a', fail('PROVIDER_UNAVAILABLE'));
    const b = fake('b', async () => ok());
    const { gw, advance } = setup([a, b], cfg({ breaker: { failures: 2, cooldownMs: 1000 } }));
    await gw.complete(req());
    await gw.complete(req());
    assert.equal(a.calls, 2);
    await gw.complete(req());
    assert.equal(a.calls, 2, 'open: skipped');
    advance(1001);
    await gw.complete(req());
    assert.equal(a.calls, 3, 'half-open after cooldown');
  });
  it('a success resets the failure counter', async () => {
    let n = 0;
    const a = fake('a', async () => {
      n += 1;
      if (n % 2 === 1) throw new LlmError('TIMEOUT', 'x');
      return ok();
    });
    const b = fake('b', async () => ok());
    const { gw } = setup([a, b], cfg({ breaker: { failures: 2, cooldownMs: 100000 } }));
    for (let i = 0; i < 6; i++) await gw.complete(req());
    assert.equal(a.calls, 6, 'never opened');
  });
});

describe('audit', () => {
  it('emits metadata only — never message content or output text', async () => {
    const a = fake('a', async () => ok('SECRET-ANSWER'));
    const { gw, events } = setup([a], cfg({}, ['a']));
    await gw.complete(req({ messages: [{ role: 'user', content: 'SECRET-QUESTION' }] }));
    const dump = JSON.stringify(events);
    assert.equal(dump.includes('SECRET'), false);
    assert.equal(events.length, 1);
    assert.equal((events[0] as { outcome: string }).outcome, 'ok');
  });
  it('emits exactly one event on failure too', async () => {
    const a = fake('a', fail('TIMEOUT'));
    const { gw, events } = setup([a], cfg({}, ['a']));
    await codeOf(gw.complete(req()));
    assert.equal(events.length, 1);
    assert.equal((events[0] as { outcome: string }).outcome, 'ALL_PROVIDERS_FAILED');
  });
});

describe('budget store failures', () => {
  function withStore(store: BudgetStore, providers: LlmProvider[]) {
    const clock = { now: () => new Date('2026-11-19T10:00:00Z') };
    return new LlmGateway({
      config: cfg({}, providers.map((p) => p.id)),
      providers: Object.fromEntries(providers.map((p) => [p.id, p])),
      clock,
      budgetStore: store,
    });
  }
  it('fails closed (BUDGET_EXCEEDED) and never calls a provider when the reservation cannot be saved', async () => {
    const a = fake('a', async () => ok());
    const gw = withStore({ load: () => null, save: () => { throw new Error('disk full'); } }, [a]);
    assert.equal(await codeOf(gw.complete(req())), 'BUDGET_EXCEEDED');
    assert.equal(a.calls, 0);
  });
  it('a failed save after a successful answer does not trigger a second provider call', async () => {
    const a = fake('a', async () => ok('fine'));
    const b = fake('b', async () => ok('second'));
    let saves = 0;
    const gw = withStore({ load: () => null, save: () => { saves += 1; if (saves >= 2) throw new Error('disk full'); } }, [a, b]);
    const r = await gw.complete(req());
    assert.equal(r.provider, 'a');
    assert.equal(r.text, 'fine');
    assert.equal(b.calls, 0);
  });
  it('a rolled-back reservation does not leak budget', async () => {
    const a = fake('a', async () => ok());
    let failing = true;
    const store: BudgetStore = { load: () => null, save: () => { if (failing) throw new Error('x'); } };
    const gw = new LlmGateway({
      config: cfg({ budget: { maxRequestsPerDay: 1, maxTokensPerDay: 100000 } }, ['a']),
      providers: { a },
      clock: { now: () => new Date('2026-11-19T10:00:00Z') },
      budgetStore: store,
    });
    assert.equal(await codeOf(gw.complete(req())), 'BUDGET_EXCEEDED');
    failing = false;
    assert.equal(await codeOf(gw.complete(req())), 'none');
  });
});
