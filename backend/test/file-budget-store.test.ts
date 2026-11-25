import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { FileBudgetStore, LlmGateway, LlmError, SAFE_DEFAULT_CONFIG } from '../src/index.ts';
import type { GatewayConfig, LlmProvider, LlmRequest } from '../src/index.ts';

const dir = mkdtempSync(join(tmpdir(), 'fc-budget-'));
after(() => rmSync(dir, { recursive: true, force: true }));

describe('FileBudgetStore', () => {
  it('returns null when the file does not exist', () => {
    assert.equal(new FileBudgetStore(join(dir, 'none.json')).load(), null);
  });
  it('round-trips and creates parent directories; leaves no temp file', () => {
    const p = join(dir, 'a', 'b', 'budget.json');
    const s = new FileBudgetStore(p);
    s.save({ day: '2026-11-19', requests: 3, tokens: 120 });
    assert.deepEqual(new FileBudgetStore(p).load(), { day: '2026-11-19', requests: 3, tokens: 120 });
    assert.equal(existsSync(`${p}.tmp`), false);
    s.save({ day: '2026-11-19', requests: 4, tokens: 200 });
    assert.deepEqual(JSON.parse(readFileSync(p, 'utf8')), { day: '2026-11-19', requests: 4, tokens: 200 });
  });
  it('throws on corrupt or invalid content instead of assuming zero', () => {
    const bad = ['{not json', 'null', '[]', '{"day":"x","requests":1,"tokens":1}', '{"day":"2026-11-19","requests":-1,"tokens":1}', '{"day":"2026-11-19","requests":1.5,"tokens":1}', '{"day":"2026-11-19","requests":"1","tokens":1}'];
    bad.forEach((content, i) => {
      const p = join(dir, `bad-${i}.json`);
      writeFileSync(p, content);
      assert.throws(() => new FileBudgetStore(p).load(), /budget file/, content);
    });
  });
});

describe('budget survives a restart end to end', () => {
  const cfg: GatewayConfig = {
    ...SAFE_DEFAULT_CONFIG,
    enabled: true,
    purposes: {
      ...SAFE_DEFAULT_CONFIG.purposes,
      voice_understanding: { enabled: true, providers: ['a'], maxOutputTokens: 50, maxInputChars: 200 },
    },
    budget: { maxRequestsPerDay: 2, maxTokensPerDay: 100000 },
  };
  const provider: LlmProvider = {
    id: 'a',
    capabilities: { json: true, maxContextTokens: 8000 },
    complete: async () => ({ text: 'ok', finishReason: 'stop', usage: { inputTokens: 1, outputTokens: 1 }, model: 'm' }),
  };
  const req: LlmRequest = {
    requestId: 'r',
    purpose: 'voice_understanding',
    messages: [{ role: 'user', content: 'hi' }],
    maxOutputTokens: 10,
    responseFormat: 'text',
    timeoutMs: 1000,
  };
  const make = (path: string, iso: string) =>
    new LlmGateway({ config: cfg, providers: { a: provider }, clock: { now: () => new Date(iso) }, budgetStore: new FileBudgetStore(path) });

  it('a new Gateway on the same file keeps the spent budget; the next Cairo day starts fresh', async () => {
    const p = join(dir, 'restart.json');
    const g1 = make(p, '2026-11-19T10:00:00Z');
    await g1.complete(req);
    await g1.complete(req);
    const g2 = make(p, '2026-11-19T11:00:00Z'); // "restart"
    await assert.rejects(g2.complete(req), (e: unknown) => e instanceof LlmError && e.code === 'BUDGET_EXCEEDED');
    const g3 = make(p, '2026-11-20T10:00:00Z');
    assert.equal((await g3.complete(req)).text, 'ok');
  });
});
