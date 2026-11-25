import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DomainError, FleetService } from '../src/index.ts';
import type { Clock, ErrorCode } from '../src/index.ts';

const CAPTAIN = 'captain-1';
const OTHER = 'captain-2';

function setup(startIso = '2026-11-14T08:00:00Z') {
  let current = new Date(startIso);
  let n = 0;
  const clock: Clock = { now: () => new Date(current.getTime()) };
  const svc = new FleetService({ clock, ids: { next: () => `id-${++n}` } });
  return {
    svc,
    setNow(iso: string) {
      current = new Date(iso);
    },
  };
}

function rejects(fn: () => unknown, code: ErrorCode) {
  assert.throws(fn, (e: unknown) => e instanceof DomainError && e.code === code, `expected ${code}`);
}

/** مفتاح صالح (16+ حرفًا) يتغير برقم. */
const key = (tag: string) => `key-${tag}-`.padEnd(16, 'x'); // الفاصل يمنع تصادم trip-1 مع trip-10

function openShift(env: ReturnType<typeof setup>, owner = CAPTAIN, km = 1000) {
  const v = env.svc.registerVehicle(owner, 'Car');
  return env.svc.startShift({ ownerUserId: owner, vehicleId: v.id, startOdometerKm: km });
}

function addTrip(env: ReturnType<typeof setup>, shiftId: string, i: number, owner = CAPTAIN, fare = 10000 + i) {
  return env.svc.recordTrip({
    ownerUserId: owner,
    shiftId,
    platform: 'uber',
    occurredAt: '2026-11-14T09:00:00Z',
    fareMinor: fare,
    idempotencyKey: key(`trip-${i}`),
  }).trip;
}

const auditCount = (svc: FleetService, action: string, owner = CAPTAIN) =>
  svc.auditLog(owner).filter((a) => a.action === action).length;

describe('O-02: Idempotency-Key على بقية العمليات (ADR-006 PROPOSED)', () => {
  it('registerVehicle: replay returns the same vehicle with one audit event', () => {
    const { svc } = setup();
    const a = svc.registerVehicle(CAPTAIN, 'Car', key('veh'));
    const b = svc.registerVehicle(CAPTAIN, 'Car', key('veh'));
    assert.equal(b.id, a.id);
    assert.equal(auditCount(svc, 'vehicle.register'), 1);
    rejects(() => svc.registerVehicle(CAPTAIN, 'Other label', key('veh')), 'IDEMPOTENCY_KEY_REUSED');
  });

  it('startShift: a retry succeeds even after the state moved on (lookup precedes state checks)', () => {
    const env = setup();
    const v = env.svc.registerVehicle(CAPTAIN, 'Car');
    const input = { ownerUserId: CAPTAIN, vehicleId: v.id, startOdometerKm: 500, idempotencyKey: key('start') };
    const first = env.svc.startShift(input);
    env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: first.id, endOdometerKm: 600 });
    // بلا مفتاح كانت إعادة البدء تنجح كشيفت جديد؛ بالمفتاح تُعاد الاستجابة الأولى ولا يُنشأ شيفت ثانٍ.
    const replay = env.svc.startShift(input);
    assert.equal(replay.id, first.id);
    assert.equal(replay.status, 'OPEN'); // لقطة الاستجابة الأولى
    assert.equal(env.svc.listShifts(CAPTAIN).items.length, 1);
    assert.equal(auditCount(env.svc, 'shift.start'), 1);
    rejects(() => env.svc.startShift({ ...input, startOdometerKm: 501 }), 'IDEMPOTENCY_KEY_REUSED');
  });

  it('endShift: replay returns the closed shift once; a different odometer is a reuse error', () => {
    const env = setup();
    const s = openShift(env);
    const input = { ownerUserId: CAPTAIN, shiftId: s.id, endOdometerKm: 1100, idempotencyKey: key('end') };
    const first = env.svc.endShift(input);
    const replay = env.svc.endShift(input);
    assert.equal(replay.id, first.id);
    assert.equal(replay.status, 'CLOSED');
    assert.equal(auditCount(env.svc, 'shift.end'), 1);
    rejects(() => env.svc.endShift({ ...input, endOdometerKm: 1200 }), 'IDEMPOTENCY_KEY_REUSED');
  });

  it('cancelShift: replay does not log twice; a different reason is a reuse error', () => {
    const env = setup();
    const s = openShift(env);
    const input = { ownerUserId: CAPTAIN, shiftId: s.id, reason: 'started by mistake', idempotencyKey: key('cancel') };
    const first = env.svc.cancelShift(input);
    const replay = env.svc.cancelShift(input);
    assert.equal(replay.id, first.id);
    assert.equal(replay.cancelReason, 'started by mistake');
    assert.equal(auditCount(env.svc, 'shift.cancel'), 1);
    rejects(() => env.svc.cancelShift({ ...input, reason: 'another' }), 'IDEMPOTENCY_KEY_REUSED');
  });

  it('voidTrip: replay returns the voided trip once (no CONFLICT "already voided")', () => {
    const env = setup();
    const s = openShift(env);
    const t = addTrip(env, s.id, 1);
    const input = { ownerUserId: CAPTAIN, tripId: t.id, reason: 'duplicate entry', idempotencyKey: key('void') };
    const first = env.svc.voidTrip(input);
    const replay = env.svc.voidTrip(input);
    assert.equal(replay.id, first.id);
    assert.equal(replay.status, 'VOIDED');
    assert.equal(auditCount(env.svc, 'trip.void'), 1);
    rejects(() => env.svc.voidTrip({ ...input, reason: 'different' }), 'IDEMPOTENCY_KEY_REUSED');
  });

  it('correct: replay appends exactly one correction; payload changes are reuse errors', () => {
    const env = setup();
    const s = openShift(env);
    const t = addTrip(env, s.id, 1, CAPTAIN, 15000);
    env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s.id, endOdometerKm: 1100 });
    const input = {
      ownerUserId: CAPTAIN,
      shiftId: s.id,
      field: 'trip.fare_minor' as const,
      entityId: t.id,
      newValue: 16000,
      reason: 'typo',
      idempotencyKey: key('corr'),
    };
    const first = env.svc.correct(input);
    const replay = env.svc.correct(input);
    assert.equal(replay.id, first.id);
    assert.equal(env.svc.corrections(CAPTAIN, s.id).length, 1);
    assert.equal(auditCount(env.svc, 'correction.append'), 1);
    rejects(() => env.svc.correct({ ...input, newValue: 17000 }), 'IDEMPOTENCY_KEY_REUSED');
    rejects(() => env.svc.correct({ ...input, reason: 'other reason' }), 'IDEMPOTENCY_KEY_REUSED');
  });

  it('a key cannot be reused across different operations', () => {
    const env = setup();
    const s = openShift(env);
    const t = addTrip(env, s.id, 1);
    env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s.id, endOdometerKm: 1100, idempotencyKey: key('shared') });
    rejects(
      () => env.svc.voidTrip({ ownerUserId: CAPTAIN, tripId: t.id, reason: 'x', idempotencyKey: key('shared') }),
      'IDEMPOTENCY_KEY_REUSED',
    );
    // ومفتاح recordTrip (نفس المخزن الموحد) لا يُعاد استخدامه في عملية أخرى
    rejects(
      () => env.svc.cancelShift({ ownerUserId: CAPTAIN, shiftId: s.id, reason: 'x', idempotencyKey: key('trip-1') }),
      'IDEMPOTENCY_KEY_REUSED',
    );
  });

  it('a failed attempt does not consume the key', () => {
    const env = setup();
    const s = openShift(env, CAPTAIN, 1000);
    const k = key('retry');
    rejects(
      () => env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s.id, endOdometerKm: 900, idempotencyKey: k }),
      'VALIDATION_FAILED',
    );
    const ok = env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s.id, endOdometerKm: 1200, idempotencyKey: k });
    assert.equal(ok.status, 'CLOSED');
    assert.equal(ok.endOdometerKm, 1200);
  });

  it('keys are scoped per captain on the new operations', () => {
    const env = setup();
    const a = env.svc.registerVehicle(CAPTAIN, 'Car', key('same'));
    const b = env.svc.registerVehicle(OTHER, 'Car', key('same'));
    assert.notEqual(a.id, b.id);
    assert.equal(b.ownerUserId, OTHER);
  });

  it('enforces the 16..128 length contract on the new operations', () => {
    for (const [len, ok] of [
      [15, false],
      [16, true],
      [128, true],
      [129, false],
    ] as const) {
      const { svc } = setup();
      const attempt = () => svc.registerVehicle(CAPTAIN, 'Car', 'k'.repeat(len));
      if (ok) attempt();
      else rejects(attempt, 'VALIDATION_FAILED');
    }
    rejects(() => setup().svc.registerVehicle(CAPTAIN, 'Car', ''), 'VALIDATION_FAILED');
  });

  it('rejects unsupported payload values instead of throwing a raw TypeError', () => {
    const env = setup();
    const s = openShift(env);
    env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s.id, endOdometerKm: 1100 });
    rejects(
      () =>
        env.svc.correct({
          ownerUserId: CAPTAIN,
          shiftId: s.id,
          field: 'shift.end_odometer_km',
          newValue: { nested: true } as never,
          reason: 'x',
          idempotencyKey: key('weird'),
        }),
      'VALIDATION_FAILED',
    );
  });

  it('without a key the behaviour is unchanged (HTTP layer must require the header — O-10)', () => {
    const { svc } = setup();
    svc.registerVehicle(CAPTAIN, 'Car A');
    rejects(() => svc.registerVehicle(CAPTAIN, 'Car B'), 'CONFLICT');
  });
});

describe('O-08: القوائم بترقيم cursor', () => {
  it('returns an empty page with a null cursor', () => {
    const { svc } = setup();
    assert.deepEqual(svc.listVehicles(CAPTAIN), { items: [], nextCursor: null });
    assert.deepEqual(svc.listShifts(CAPTAIN), { items: [], nextCursor: null });
  });

  it('walks all pages in creation order with no gaps or duplicates (3+3+1)', () => {
    const env = setup();
    const s = openShift(env);
    const ids = Array.from({ length: 7 }, (_, i) => addTrip(env, s.id, i).id);
    const seen: string[] = [];
    let cursor: string | undefined;
    const sizes: number[] = [];
    do {
      const page = env.svc.listTrips(CAPTAIN, s.id, { limit: 3, ...(cursor ? { cursor } : {}) });
      sizes.push(page.items.length);
      seen.push(...page.items.map((t) => t.id));
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    assert.deepEqual(sizes, [3, 3, 1]);
    assert.deepEqual(seen, ids);
  });

  it('has no phantom empty page when the count is an exact multiple of the limit', () => {
    const env = setup();
    const s = openShift(env);
    for (let i = 0; i < 6; i++) addTrip(env, s.id, i);
    const p1 = env.svc.listTrips(CAPTAIN, s.id, { limit: 3 });
    assert.notEqual(p1.nextCursor, null);
    const p2 = env.svc.listTrips(CAPTAIN, s.id, { limit: 3, cursor: p1.nextCursor as string });
    assert.equal(p2.items.length, 3);
    assert.equal(p2.nextCursor, null);
  });

  it('defaults to 25 items per page (OpenAPI Limit default)', () => {
    const env = setup();
    const s = openShift(env);
    for (let i = 0; i < 30; i++) addTrip(env, s.id, i);
    const p1 = env.svc.listTrips(CAPTAIN, s.id);
    assert.equal(p1.items.length, 25);
    const p2 = env.svc.listTrips(CAPTAIN, s.id, { cursor: p1.nextCursor as string });
    assert.equal(p2.items.length, 5);
    assert.equal(p2.nextCursor, null);
  });

  it('validates limit 1..100', () => {
    const env = setup();
    for (const bad of [0, 101, -1, 1.5, Number.NaN, '5' as never]) {
      rejects(() => env.svc.listVehicles(CAPTAIN, { limit: bad }), 'VALIDATION_FAILED');
    }
    env.svc.listVehicles(CAPTAIN, { limit: 1 });
    env.svc.listVehicles(CAPTAIN, { limit: 100 });
  });

  it('rejects tampered, foreign and cross-list cursors identically (VALIDATION_FAILED)', () => {
    const env = setup();
    const s1 = openShift(env);
    for (let i = 0; i < 3; i++) addTrip(env, s1.id, i);
    env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s1.id, endOdometerKm: 1100 });
    const v2 = env.svc.retireVehicle({ ownerUserId: CAPTAIN, vehicleId: s1.vehicleId });
    assert.equal(v2.status, 'retired');
    const v3 = env.svc.registerVehicle(CAPTAIN, 'Car 2');
    const s2 = env.svc.startShift({ ownerUserId: CAPTAIN, vehicleId: v3.id, startOdometerKm: 1100 });
    for (let i = 10; i < 13; i++) addTrip(env, s2.id, i);

    const good = env.svc.listTrips(CAPTAIN, s1.id, { limit: 1 }).nextCursor as string;
    const encode = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
    for (const bad of ['', 'not-a-cursor', '###', encode({ v: 2, after: 'id-1' }), encode({ v: 1 }), encode(null), encode({ v: 1, after: 'nope' })]) {
      rejects(() => env.svc.listTrips(CAPTAIN, s1.id, { cursor: bad }), 'VALIDATION_FAILED');
    }
    // مؤشر قائمة رحلات الشيفت 1 لا يصلح لقائمة الشيفت 2
    rejects(() => env.svc.listTrips(CAPTAIN, s2.id, { cursor: good }), 'VALIDATION_FAILED');
    // ولا يصلح لقائمة كابتن آخر
    const otherShift = openShift(env, OTHER);
    rejects(() => env.svc.listTrips(OTHER, otherShift.id, { cursor: good }), 'VALIDATION_FAILED');
    // ولا لقائمة مركبات
    rejects(() => env.svc.listVehicles(CAPTAIN, { cursor: good }), 'VALIDATION_FAILED');
  });

  it('hides other captains: foreign/unknown shifts are NOT_FOUND and lists never mix owners', () => {
    const env = setup();
    const mine = openShift(env, CAPTAIN);
    const theirs = openShift(env, OTHER);
    addTrip(env, mine.id, 1);
    addTrip(env, theirs.id, 2, OTHER);
    rejects(() => env.svc.listTrips(CAPTAIN, theirs.id), 'NOT_FOUND');
    rejects(() => env.svc.listTrips(CAPTAIN, 'missing'), 'NOT_FOUND');
    assert.equal(env.svc.listTrips(CAPTAIN, mine.id).items.length, 1);
    assert.equal(env.svc.listShifts(CAPTAIN).items.every((s) => s.ownerUserId === CAPTAIN), true);
    assert.equal(env.svc.listVehicles(OTHER).items.every((v) => v.ownerUserId === OTHER), true);
  });

  it('lists effective values (corrections applied) and keeps VOIDED trips; originals stay untouched', () => {
    const env = setup();
    const s = openShift(env, CAPTAIN, 1000);
    const t1 = addTrip(env, s.id, 1, CAPTAIN, 15000);
    const t2 = addTrip(env, s.id, 2, CAPTAIN, 20000);
    env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s.id, endOdometerKm: 1100 });
    env.svc.correct({ ownerUserId: CAPTAIN, shiftId: s.id, field: 'trip.fare_minor', entityId: t1.id, newValue: 16000, reason: 'typo' });
    env.svc.correct({ ownerUserId: CAPTAIN, shiftId: s.id, field: 'trip.status', entityId: t2.id, newValue: 'VOIDED', reason: 'duplicate' });
    env.svc.correct({ ownerUserId: CAPTAIN, shiftId: s.id, field: 'shift.end_odometer_km', newValue: 1150, reason: 'misread' });

    const trips = env.svc.listTrips(CAPTAIN, s.id).items;
    assert.equal(trips.length, 2);
    assert.equal(trips[0]?.fare.amountMinor, 16000);
    assert.equal(trips[1]?.status, 'VOIDED');
    assert.equal(env.svc.listShifts(CAPTAIN).items[0]?.endOdometerKm, 1150);
    // الأصل لم يتغير
    assert.equal(env.svc.getTrip(CAPTAIN, t1.id).fare.amountMinor, 15000);
    assert.equal(env.svc.getTrip(CAPTAIN, t2.id).status, 'RECORDED');
    assert.equal(env.svc.getShift(CAPTAIN, s.id).endOdometerKm, 1100);
  });

  it('keeps creation order after updates and includes retired vehicles', () => {
    const env = setup();
    const v1 = env.svc.registerVehicle(CAPTAIN, 'Car 1');
    const s1 = env.svc.startShift({ ownerUserId: CAPTAIN, vehicleId: v1.id, startOdometerKm: 10 });
    env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s1.id, endOdometerKm: 20 });
    const s2 = env.svc.startShift({ ownerUserId: CAPTAIN, vehicleId: v1.id, startOdometerKm: 20 });
    env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s2.id, endOdometerKm: 30 });
    // تحديث s2 (OPEN→CLOSED) لا يغيّر موضعه في القائمة
    assert.deepEqual(env.svc.listShifts(CAPTAIN).items.map((s) => [s.id, s.status]), [
      [s1.id, 'CLOSED'],
      [s2.id, 'CLOSED'],
    ]);
    env.svc.retireVehicle({ ownerUserId: CAPTAIN, vehicleId: v1.id });
    const v2 = env.svc.registerVehicle(CAPTAIN, 'Car 2');
    assert.deepEqual(env.svc.listVehicles(CAPTAIN).items.map((v) => [v.id, v.status]), [
      [v1.id, 'retired'],
      [v2.id, 'active'],
    ]);
  });

  it('cursors stay valid when new items are appended between page requests', () => {
    const env = setup();
    const s = openShift(env);
    const first = [0, 1, 2, 3].map((i) => addTrip(env, s.id, i).id);
    const p1 = env.svc.listTrips(CAPTAIN, s.id, { limit: 2 });
    const added = addTrip(env, s.id, 99).id;
    const p2 = env.svc.listTrips(CAPTAIN, s.id, { limit: 10, cursor: p1.nextCursor as string });
    assert.deepEqual([...p1.items, ...p2.items].map((t) => t.id), [...first, added]);
  });

  it('returns frozen pages', () => {
    const env = setup();
    env.svc.registerVehicle(CAPTAIN, 'Car');
    const page = env.svc.listVehicles(CAPTAIN);
    assert.equal(Object.isFrozen(page), true);
    assert.equal(Object.isFrozen(page.items), true);
  });
});
