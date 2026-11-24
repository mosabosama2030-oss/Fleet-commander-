import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LlmError, LlmGateway, SAFE_DEFAULT_CONFIG } from '../src/ai/contracts.ts';
import { createConfiguredLlmProviders, PROVIDER_CATALOG } from '../src/ai/providers/registry.ts';
import { createOpenAICompatibleProvider } from '../src/ai/providers/openai-compatible.ts';
import type { LlmRequest, ProviderResult } from '../src/ai/contracts.ts';

const REQUEST: LlmRequest = {
  requestId: 'synthetic-provider-test',
  purpose: 'voice_understanding',
  messages: [
    { role: 'system', content: 'Return JSON only.' },
    { role: 'user', content: 'سجل رحلة أوبر ٨٥' },
  ],
  maxOutputTokens: 64,
  responseFormat: 'json',
  timeoutMs: 1_000,
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockFetch(
  handler: (url: string, init: RequestInit) => Promise<Response> | Response,
  calls: { url: string; init: RequestInit }[] = [],
): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const requestInit = init ?? {};
    calls.push({ url: String(input), init: requestInit });
    return handler(String(input), requestInit);
  }) as typeof fetch;
}

function completion(
  text = '{"kind":"record_trip","platform":"uber","fare_egp":85}',
  extras: Record<string, unknown> = {},
): unknown {
  return {
    id: 'synthetic-response',
    model: 'mock-model',
    choices: [{
      index: 0,
      finish_reason: 'stop',
      message: { role: 'assistant', content: text },
    }],
    usage: { prompt_tokens: 12, completion_tokens: 8 },
    ...extras,
  };
}

function provider(fetcher: typeof fetch, supportsJson = true) {
  return createOpenAICompatibleProvider({
    id: 'mock-provider',
    baseUrl: 'https://api.mistral.ai/v1',
    apiKey: 'synthetic-test-key',
    model: 'mistral-small-2603',
    supportsJson,
    maxContextTokens: 262_144,
    fetcher,
  });
}

async function thrownCode(action: () => Promise<unknown>): Promise<string> {
  try {
    await action();
  } catch (error) {
    return error instanceof LlmError ? error.code : 'UNEXPECTED_ERROR';
  }
  return 'NO_ERROR';
}

describe('OpenAI-compatible LlmProvider adapter', () => {
  it('sends a bounded JSON-mode request and normalizes the completion', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const p = provider(mockFetch(() => response(completion()), calls));
    const result = await p.complete(REQUEST, new AbortController().signal);

    assert.equal(result.text, '{"kind":"record_trip","platform":"uber","fare_egp":85}');
    assert.deepEqual(result.finishReason, 'stop');
    assert.deepEqual(result.usage, { inputTokens: 12, outputTokens: 8 });
    assert.equal(result.model, 'mock-model');
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, 'https://api.mistral.ai/v1/chat/completions');
    assert.equal(calls[0]?.init.redirect, 'error');

    const headers = new Headers(calls[0]?.init.headers);
    assert.equal(headers.get('authorization'), 'Bearer synthetic-test-key');
    assert.equal(headers.get('content-type'), 'application/json');

    const body = JSON.parse(String(calls[0]?.init.body)) as Record<string, unknown>;
    assert.equal(body.model, 'mistral-small-2603');
    assert.equal(body.max_tokens, 64);
    assert.equal(body.stream, false);
    assert.deepEqual(body.messages, REQUEST.messages);
    assert.deepEqual(body.response_format, { type: 'json_object' });
  });

  it('estimates usage conservatively when the provider omits usage', async () => {
    const body = completion('{"ok":true}');
    delete (body as { usage?: unknown }).usage;
    const p = provider(mockFetch(() => response(body)));
    const result = await p.complete(
      { ...REQUEST, responseFormat: 'text' },
      new AbortController().signal,
    );

    assert.equal(result.usage.inputTokens, Math.ceil(
      REQUEST.messages.reduce((total, item) => total + item.content.length, 0) / 2,
    ));
    assert.equal(result.usage.outputTokens, Math.ceil('{"ok":true}'.length / 2));
  });

  it('accepts text blocks in a compatible content array without forwarding extra fields', async () => {
    const body = completion('');
    const choices = (body as { choices: Record<string, unknown>[] }).choices;
    choices[0]!.message = {
      role: 'assistant',
      content: [
        { type: 'text', text: '{"kind":"query","what":"trip_count"}' },
        { type: 'reasoning', text: 'not part of the public answer' },
      ],
    };
    const p = provider(mockFetch(() => response(body)));
    const result = await p.complete(REQUEST, new AbortController().signal);
    assert.equal(result.text, '{"kind":"query","what":"trip_count"}');
  });

  it('rejects JSON requests when the provider is not explicitly JSON-capable', async () => {
    let calls = 0;
    const p = provider(mockFetch(() => {
      calls += 1;
      return response(completion());
    }), false);

    assert.equal(await thrownCode(() => p.complete(REQUEST, new AbortController().signal)), 'BAD_REQUEST');
    assert.equal(calls, 0);
  });

  it('maps authorization, rate-limit, timeout, server and client errors without body leakage', async () => {
    const cases: [number, string][] = [
      [400, 'BAD_REQUEST'],
      [401, 'AUTH_FAILED'],
      [403, 'AUTH_FAILED'],
      [408, 'TIMEOUT'],
      [429, 'RATE_LIMITED'],
      [500, 'PROVIDER_UNAVAILABLE'],
      [504, 'TIMEOUT'],
    ];
    for (const [status, code] of cases) {
      const p = provider(mockFetch(() => response({ error: 'synthetic-secret-response-body' }, status)));
      assert.equal(
        await thrownCode(() => p.complete(REQUEST, new AbortController().signal)),
        code,
        String(status),
      );
    }

    const p = provider(mockFetch(() => response({ error: 'synthetic-secret-response-body' }, 401)));
    try {
      await p.complete(REQUEST, new AbortController().signal);
      assert.fail('expected provider error');
    } catch (error) {
      assert.ok(error instanceof LlmError);
      assert.equal(error.message.includes('synthetic-secret-response-body'), false);
      assert.equal(error.message.includes('synthetic-test-key'), false);
    }
  });

  it('maps an aborted transport to TIMEOUT and preserves AbortSignal', async () => {
    let receivedSignal: AbortSignal | null = null;
    const fetcher = (async (_input: string | URL | Request, init?: RequestInit) => (
      new Promise<Response>((_resolve, reject) => {
        receivedSignal = init?.signal ?? null;
        init?.signal?.addEventListener('abort', () => {
          reject(Object.assign(new Error('synthetic cancellation'), { name: 'AbortError' }));
        }, { once: true });
      })
    )) as typeof fetch;
    const controller = new AbortController();
    const pending = provider(fetcher).complete(REQUEST, controller.signal);
    controller.abort();

    assert.equal(await thrownCode(() => pending), 'TIMEOUT');
    assert.equal(receivedSignal, controller.signal);
    assert.equal(controller.signal.aborted, true);
  });

  it('rejects malformed provider payloads and unknown finish reasons', async () => {
    const invalidJson = mockFetch(() => new Response('not-json', { status: 200 }));
    assert.equal(
      await thrownCode(() => provider(invalidJson).complete(REQUEST, new AbortController().signal)),
      'INVALID_OUTPUT',
    );

    const malformed = completion();
    (malformed as { choices: unknown[] }).choices = [];
    assert.equal(
      await thrownCode(() => provider(mockFetch(() => response(malformed))).complete(REQUEST, new AbortController().signal)),
      'INVALID_OUTPUT',
    );

    const unknownFinish = completion();
    ((unknownFinish as { choices: Record<string, unknown>[] }).choices[0]!).finish_reason = 'mystery';
    assert.equal(
      await thrownCode(() => provider(mockFetch(() => response(unknownFinish))).complete(REQUEST, new AbortController().signal)),
      'INVALID_OUTPUT',
    );
  });

  it('rejects provider responses larger than one megabyte', async () => {
    const largeBody = ' '.repeat(1_000_001);
    const p = provider(mockFetch(() => new Response(largeBody, { status: 200 })));
    assert.equal(
      await thrownCode(() => p.complete(REQUEST, new AbortController().signal)),
      'INVALID_OUTPUT',
    );
  });

  it('rejects unreviewed hosts and invalid API keys at construction', () => {
    const options = {
      id: 'mock-provider',
      baseUrl: 'https://api.mistral.ai/v1',
      apiKey: 'synthetic-test-key',
      model: 'mistral-small-2603',
      supportsJson: true,
      maxContextTokens: 262_144,
      fetcher: mockFetch(() => response(completion())),
    };
    assert.throws(() => createOpenAICompatibleProvider({ ...options, baseUrl: 'https://127.0.0.1/private' }));
    assert.throws(() => createOpenAICompatibleProvider({ ...options, apiKey: 'bad\r\nheader' }));
  });
});

describe('fixed provider registry and closed-by-default Gateway', () => {
  it('returns no adapters with no explicitly configured provider keys', () => {
    let calls = 0;
    const registry = createConfiguredLlmProviders({}, mockFetch(() => {
      calls += 1;
      return response(completion());
    }));

    assert.deepEqual(Object.keys(registry), []);
    assert.equal(calls, 0);
  });

  it('creates only adapters backed by explicit server keys and makes no call on construction', () => {
    let calls = 0;
    const registry = createConfiguredLlmProviders({
      FC_OPENROUTER_API_KEY: 'synthetic-openrouter-key',
      FC_GEMINI_API_KEY: 'synthetic-gemini-key',
      FC_NVIDIA_API_KEY: 'synthetic-nvidia-key',
    }, mockFetch(() => {
      calls += 1;
      return response(completion());
    }));

    assert.deepEqual(Object.keys(registry).sort(), [
      'gemini-flash-lite',
      'nvidia-nemotron-3-ultra',
      'openrouter-gemma-4',
    ]);
    assert.equal(calls, 0);
    assert.equal(registry['openrouter-gemma-4']?.capabilities.json, true);
    assert.equal(registry['gemini-flash-lite']?.capabilities.json, false);
    assert.equal(registry['nvidia-nemotron-3-ultra']?.capabilities.json, false);
  });

  it('pins models, hosts and JSON capabilities in code', () => {
    assert.deepEqual(PROVIDER_CATALOG.map((item) => ({
      id: item.id,
      model: item.model,
      supportsJson: item.supportsJson,
    })), [
      { id: 'openrouter-gemma-4', model: 'google/gemma-4-31b-it:free', supportsJson: true },
      { id: 'gemini-flash-lite', model: 'gemini-3.1-flash-lite', supportsJson: false },
      { id: 'mistral-small-4', model: 'mistral-small-2603', supportsJson: true },
      { id: 'nvidia-nemotron-3-ultra', model: 'nvidia/nemotron-3-ultra-550b-a55b', supportsJson: false },
    ]);
  });

  it('does not make a provider request while SAFE_DEFAULT_CONFIG is active', async () => {
    let calls = 0;
    const registry = createConfiguredLlmProviders({
      FC_OPENROUTER_API_KEY: 'synthetic-openrouter-key',
      FC_MISTRAL_API_KEY: 'synthetic-mistral-key',
    }, mockFetch(() => {
      calls += 1;
      return response(completion());
    }));
    const gateway = new LlmGateway({
      config: SAFE_DEFAULT_CONFIG,
      providers: registry,
      clock: { now: () => new Date('2026-11-24T00:00:00Z') },
    });

    await assert.rejects(
      () => gateway.complete(REQUEST),
      (error: unknown) => error instanceof LlmError && error.code === 'DISABLED',
    );
    assert.equal(calls, 0);
  });
});
