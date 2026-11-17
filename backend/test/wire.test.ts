import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DomainError,
  FleetService,
  errorResponse,
  idempotencyKeyFrom,
  listOptionsFrom,
  toWirePage,
  wireErrorResponse,
} from '../src/index.ts';
import type { Clock } from '../src/index.ts';

const REQ = 'req-1';

function svc() {
  let n = 0;
  const clock: Clock = { now: () => new Date('2026-11-14T08:00:00Z') };
  return new FleetService({ clock, ids: { next: () => `id-${++n}` } });
}

function code(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    return e instanceof DomainError ? e.code : `other:${String(e)}`;
  }
  return 'none';
}

describe('idempotencyKeyFrom', () => {
  it('reads the header case-insensitively', () => {
    assert.equal(idempotencyKeyFrom({ 'idempotency-key': 'abcdefghijklmnop' }), 'abcdefghijklmnop');
    assert.equal(idempotencyKeyFrom({ 'Idempotency-Key': 'abcdefghijklmnop' }), 'abcdefghijklmnop');
  });
  it('rejects missing, empty, blank and array values with VALIDATION_FAILED', () => {
    assert.equal(code(() => idempotencyKeyFrom({})), 'VALIDATION_FAILED');
    assert.equal(code(() => idempotencyKeyFrom({ 'idempotency-key': '' })), 'VALIDATION_FAILED');
    assert.equal(code(() => idempotencyKeyFrom({ 'idempotency-key': '   ' })), 'VALIDATION_FAILED');
    assert.equal(code(() => idempotencyKeyFrom({ 'idempotency-key': ['a'.repeat(16), 'b'.repeat(16)] })), 'VALIDATION_FAILED');
    assert.equal(code(() => idempotencyKeyFrom({ 'idempotency-key': undefined })), 'VALIDATION_FAILED');
  });
  it('rejects the header sent twice under different casings', () => {
    assert.equal(
      code(() => idempotencyKeyFrom({ 'idempotency-key': 'a'.repeat(16), 'Idempotency-Key': 'b'.repeat(16) })),
      'VALIDATION_FAILED',
    );
  });
  it('leaves length 16..128 to the domain core (end to end)', () => {
    const s = svc();
    assert.equal(code(() => s.registerVehicle('c1', 'Car', idempotencyKeyFrom({ 'idempotency-key': 'short' }))), 'VALIDATION_FAILED');
    const v = s.registerVehicle('c1', 'Car', idempotencyKeyFrom({ 'idempotency-key': 'k'.repeat(16) }));
    assert.equal(v.label, 'Car');
  });
});

describe('listOptionsFrom', () => {
  it('returns no keys when both parameters are absent', () => {
    assert.deepEqual(listOptionsFrom({}), {});
  });
  it('parses limit strictly', () => {
    assert.deepEqual(listOptionsFrom({ limit: '25' }), { limit: 25 });
    for (const bad of ['', ' 5', '5 ', '5.0', '1e1', '-1', '+5', '0x10', 'abc', '1234567890', 5, ['5'], null]) {
      assert.equal(code(() => listOptionsFrom({ limit: bad })), 'VALIDATION_FAILED', String(bad));
    }
  });
  it('range 1..100 stays enforced by the core', () => {
    const s = svc();
    assert.equal(code(() => s.listVehicles('c1', listOptionsFrom({ limit: '0' }))), 'VALIDATION_FAILED');
    assert.equal(code(() => s.listVehicles('c1', listOptionsFrom({ limit: '101' }))), 'VALIDATION_FAILED');
    assert.equal(code(() => s.listVehicles('c1', listOptionsFrom({ limit: '100' }))), 'none');
  });
  it('rejects empty or non-string cursor, passes a string through', () => {
    assert.deepEqual(listOptionsFrom({ cursor: 'abc' }), { cursor: 'abc' });
    assert.equal(code(() => listOptionsFrom({ cursor: '' })), 'VALIDATION_FAILED');
    assert.equal(code(() => listOptionsFrom({ cursor: ['a'] })), 'VALIDATION_FAILED');
  });
  it('ignores unrelated query parameters', () => {
    assert.deepEqual(listOptionsFrom({ foo: 'bar', limit: '3' }), { limit: 3 });
  });
});

describe('toWirePage', () => {
  it('renames nextCursor to next_cursor and maps items; full walk via the core', () => {
    const s = svc();
    const owner = 'owner';
    const first = s.registerVehicle(owner, 'V1');
    s.retireVehicle({ ownerUserId: owner, vehicleId: first.id });
    s.registerVehicle(owner, 'V2');
    const p1 = toWirePage(s.listVehicles(owner, listOptionsFrom({ limit: '1' })), (v) => ({ id: v.id }));
    assert.equal(p1.items.length, 1);
    assert.equal(typeof p1.next_cursor, 'string');
    const p2 = toWirePage(
      s.listVehicles(owner, listOptionsFrom({ limit: '1', cursor: p1.next_cursor as string })),
      (v) => ({ id: v.id }),
    );
    assert.equal(p2.items.length, 1);
    assert.equal(p2.next_cursor, null);
    assert.equal('nextCursor' in p2, false);
  });
  it('keeps next_cursor: null on an empty page', () => {
    assert.deepEqual(toWirePage({ items: [], nextCursor: null }, (x: number) => x), { items: [], next_cursor: null });
  });
});

describe('errorResponse / wireErrorResponse', () => {
  it('maps each domain error to its httpHint and the contract body', () => {
    const cases: Array<[DomainError, number]> = [
      [new DomainError('VALIDATION_FAILED', 'bad'), 422],
      [new DomainError('NOT_FOUND', 'nope'), 404],
      [new DomainError('CONFLICT', 'dup'), 409],
      [new DomainError('IDEMPOTENCY_KEY_REUSED', 'reused'), 409],
    ];
    for (const [err, status] of cases) {
      const r = errorResponse(err, REQ);
      assert.equal(r.status, status);
      assert.deepEqual(r.body, { code: err.code, message: err.message, request_id: REQ });
    }
  });
  it('turns unexpected errors into a generic 500 without leaking the message', () => {
    const r = errorResponse(new TypeError('secret stack detail'), REQ);
    assert.equal(r.status, 500);
    assert.deepEqual(r.body, { code: 'INTERNAL', message: 'Internal error', request_id: REQ });
    assert.equal(errorResponse('plain string', REQ).status, 500);
    assert.equal(errorResponse(null, REQ).body.code, 'INTERNAL');
  });
  it('wire-only codes carry their statuses; INTERNAL never echoes a message', () => {
    assert.equal(wireErrorResponse('UNAUTHENTICATED', 'no session', REQ).status, 401);
    assert.equal(wireErrorResponse('RATE_LIMITED', 'slow down', REQ).status, 429);
    assert.equal(wireErrorResponse('UNSUPPORTED_MEDIA_TYPE', 'json only', REQ).status, 415);
    assert.equal(wireErrorResponse('PAYLOAD_TOO_LARGE', 'too big', REQ).status, 413);
    const internal = wireErrorResponse('INTERNAL', 'db password is x', REQ);
    assert.equal(internal.status, 500);
    assert.equal(internal.body.message, 'Internal error');
  });
  it('real core failures round-trip: foreign shift is 404, reused key is 409', () => {
    const s = svc();
    const shiftOwner = s.registerVehicle('a', 'Car');
    const shift = s.startShift({ ownerUserId: 'a', vehicleId: shiftOwner.id, startOdometerKm: 10 });
    let foreign: unknown;
    try {
      s.listTrips('b', shift.id);
    } catch (e) {
      foreign = e;
    }
    assert.equal(errorResponse(foreign, REQ).status, 404);

    const key = 'k'.repeat(16);
    s.cancelShift({ ownerUserId: 'a', shiftId: shift.id, reason: 'mistake', idempotencyKey: key });
    let reused: unknown;
    try {
      s.cancelShift({ ownerUserId: 'a', shiftId: shift.id, reason: 'other', idempotencyKey: key });
    } catch (e) {
      reused = e;
    }
    const r = errorResponse(reused, REQ);
    assert.equal(r.status, 409);
    assert.equal(r.body.code, 'IDEMPOTENCY_KEY_REUSED');
  });
});
