import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DomainError, FleetService, money, operatingDate } from '../src/index.ts';
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

function openShift(env: ReturnType<typeof setup>, km = 1000) {
  const v = env.svc.registerVehicle(CAPTAIN, 'Car');
  return env.svc.startShift({ ownerUserId: CAPTAIN, vehicleId: v.id, startOdometerKm: km });
}

const trip = (shiftId: string, over: Partial<{ key: string; fare: number; at: string }> = {}) => ({
  ownerUserId: CAPTAIN,
  shiftId,
  platform: 'uber',
  occurredAt: over.at ?? '2026-11-14T09:00:00Z',
  fareMinor: over.fare ?? 15000,
  idempotencyKey: over.key ?? 'key-0000000000001',
});

describe('money (DEC-09 PROPOSED: integer minor units)', () => {
  it('accepts non-negative safe integers', () => {
    assert.equal(money(0).amountMinor, 0);
    assert.equal(money(15050).currency, 'EGP');
  });
  it('rejects fractions, negatives, NaN, strings and unsafe integers', () => {
    for (const bad of [12.5, -1, Number.NaN, Infinity, '100', null, undefined, 2 ** 53]) {
      rejects(() => money(bad), 'VALIDATION_FAILED');
    }
  });
});

describe('vehicle (DEC-01: one vehicle only)', () => {
  it('rejects a second active vehicle for the same captain', () => {
    const { svc } = setup();
    svc.registerVehicle(CAPTAIN, 'Car A');
    rejects(() => svc.registerVehicle(CAPTAIN, 'Car B'), 'CONFLICT');
  });
  it('enforces the contract label length limit (OpenAPI VehicleCreate: max 60)', () => {
    const { svc } = setup();
    assert.equal(svc.registerVehicle(CAPTAIN, 'x'.repeat(60)).label.length, 60);
    rejects(() => svc.registerVehicle(OTHER, 'x'.repeat(61)), 'VALIDATION_FAILED');
  });
  it('allows another captain to register their own vehicle', () => {
    const { svc } = setup();
    svc.registerVehicle(CAPTAIN, 'Car A');
    assert.equal(svc.registerVehicle(OTHER, 'Car B').ownerUserId, OTHER);
  });
});

describe('shift state machine', () => {
  it('T-SH-01 rejects starting a second shift while one is open', () => {
    const env = setup();
    const s = openShift(env);
    rejects(
      () => env.svc.startShift({ ownerUserId: CAPTAIN, vehicleId: s.vehicleId, startOdometerKm: 1100 }),
      'CONFLICT',
    );
  });

  it('T-SH-02 rejects end odometer lower than start', () => {
    const env = setup();
    const s = openShift(env, 1000);
    rejects(() => env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s.id, endOdometerKm: 999 }), 'VALIDATION_FAILED');
    assert.equal(env.svc.getShift(CAPTAIN, s.id).status, 'OPEN');
  });

  it('T-SH-03 rejects ending an already closed shift', () => {
    const env = setup();
    const s = openShift(env);
    env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s.id, endOdometerKm: 1100 });
    rejects(() => env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s.id, endOdometerKm: 1200 }), 'CONFLICT');
  });

  it('T-SH-04 attributes a midnight-crossing shift to the start day in Africa/Cairo', () => {
    // 21:30Z = 23:30 Cairo (UTC+2 في نوفمبر) → يوم البدء 2026-11-14، وينتهي بعد منتصف الليل
    const env = setup('2026-11-14T21:30:00Z');
    const s = openShift(env);
    env.setNow('2026-11-15T01:00:00Z'); // 03:00 Cairo في 15
    const closed = env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s.id, endOdometerKm: 1080 });
    assert.equal(closed.operatingDate, '2026-11-14');
  });

  it('operating date follows Cairo, not UTC, in winter and summer time', () => {
    assert.equal(operatingDate(new Date('2026-11-14T22:30:00Z')), '2026-11-15'); // UTC+2
    assert.equal(operatingDate(new Date('2026-07-14T21:30:00Z')), '2026-07-15'); // UTC+3 (صيفي)
    assert.equal(operatingDate(new Date('2026-07-14T20:30:00Z')), '2026-07-14');
  });

  it('cancel requires a reason and only works on OPEN shifts', () => {
    const env = setup();
    const s = openShift(env);
    rejects(() => env.svc.cancelShift({ ownerUserId: CAPTAIN, shiftId: s.id, reason: '  ' }), 'VALIDATION_FAILED');
    const c = env.svc.cancelShift({ ownerUserId: CAPTAIN, shiftId: s.id, reason: 'started by mistake' });
    assert.equal(c.status, 'CANCELLED');
    rejects(() => env.svc.cancelShift({ ownerUserId: CAPTAIN, shiftId: s.id, reason: 'again' }), 'CONFLICT');
    rejects(() => env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s.id, endOdometerKm: 2000 }), 'CONFLICT');
  });

  it('rejects invalid odometer values', () => {
    const { svc } = setup();
    const v = svc.registerVehicle(CAPTAIN, 'Car');
    for (const bad of [-1, 10.5, Number.NaN, '5' as unknown as number]) {
      rejects(() => svc.startShift({ ownerUserId: CAPTAIN, vehicleId: v.id, startOdometerKm: bad }), 'VALIDATION_FAILED');
    }
  });

  it("hides another captain's data as NOT_FOUND", () => {
    const env = setup();
    const s = openShift(env);
    rejects(() => env.svc.endShift({ ownerUserId: OTHER, shiftId: s.id, endOdometerKm: 1100 }), 'NOT_FOUND');
    rejects(() => env.svc.getShift(OTHER, s.id), 'NOT_FOUND');
    rejects(() => env.svc.startShift({ ownerUserId: OTHER, vehicleId: s.vehicleId, startOdometerKm: 1 }), 'NOT_FOUND');
  });
});

describe('trips (DEC-02: trip by trip)', () => {
  it('records a trip only while the shift is OPEN', () => {
    const env = setup();
    const s = openShift(env);
    assert.equal(env.svc.recordTrip(trip(s.id)).trip.status, 'RECORDED');
    env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s.id, endOdometerKm: 1100 });
    rejects(() => env.svc.recordTrip(trip(s.id, { key: 'key-0000000000002' })), 'CONFLICT');
  });

  it('validates platform, fare and timestamp', () => {
    const env = setup();
    const s = openShift(env);
    rejects(() => env.svc.recordTrip({ ...trip(s.id), platform: 'taxi' }), 'VALIDATION_FAILED');
    rejects(() => env.svc.recordTrip(trip(s.id, { fare: 99.5 })), 'VALIDATION_FAILED');
    rejects(() => env.svc.recordTrip(trip(s.id, { fare: -5 })), 'VALIDATION_FAILED');
    rejects(() => env.svc.recordTrip(trip(s.id, { at: '2026-11-14 09:00' })), 'VALIDATION_FAILED');
    rejects(() => env.svc.recordTrip({ ...trip(s.id), idempotencyKey: '' }), 'VALIDATION_FAILED');
  });

  it('T-IDEM-01 replaying the same key and payload returns one trip', () => {
    const env = setup();
    const s = openShift(env);
    const first = env.svc.recordTrip(trip(s.id));
    const replay = env.svc.recordTrip(trip(s.id));
    assert.equal(first.replayed, false);
    assert.equal(replay.replayed, true);
    assert.equal(replay.trip.id, first.trip.id);
    assert.equal(env.svc.auditLog(CAPTAIN).filter((a) => a.action === 'trip.record').length, 1);
  });

  it('rejects the same key with a different payload', () => {
    const env = setup();
    const s = openShift(env);
    env.svc.recordTrip(trip(s.id));
    rejects(() => env.svc.recordTrip(trip(s.id, { fare: 20000 })), 'IDEMPOTENCY_KEY_REUSED');
  });

  it('enforces the Idempotency-Key length contract (16..128)', () => {
    const attempt = (len: number) => {
      const env = setup();
      const s = openShift(env);
      return () => env.svc.recordTrip(trip(s.id, { key: 'k'.repeat(len) }));
    };
    rejects(attempt(15), 'VALIDATION_FAILED');
    assert.equal(attempt(16)().replayed, false);
    assert.equal(attempt(128)().replayed, false);
    rejects(attempt(129), 'VALIDATION_FAILED');
  });

  it('maps wire codes and HTTP hints to OPENAPI_CORE (reuse = 409 IDEMPOTENCY_KEY_REUSED)', () => {
    const env = setup();
    const s = openShift(env);
    env.svc.recordTrip(trip(s.id));
    assert.throws(
      () => env.svc.recordTrip(trip(s.id, { fare: 20000 })),
      (e: unknown) => e instanceof DomainError && e.code === 'IDEMPOTENCY_KEY_REUSED' && e.httpHint === 409,
    );
    assert.throws(
      () => env.svc.recordTrip({ ...trip(s.id), platform: 'taxi' }),
      (e: unknown) => e instanceof DomainError && e.code === 'VALIDATION_FAILED' && e.httpHint === 422,
    );
  });

  it('scopes idempotency keys per captain', () => {
    const env = setup();
    const s = openShift(env);
    env.svc.recordTrip(trip(s.id));
    const v2 = env.svc.registerVehicle(OTHER, 'Other car');
    const s2 = env.svc.startShift({ ownerUserId: OTHER, vehicleId: v2.id, startOdometerKm: 5 });
    const r = env.svc.recordTrip({ ...trip(s2.id), ownerUserId: OTHER });
    assert.equal(r.replayed, false);
  });

  it('voids with a reason and never deletes; closed shifts require a correction', () => {
    const env = setup();
    const s = openShift(env);
    const { trip: t } = env.svc.recordTrip(trip(s.id));
    rejects(() => env.svc.voidTrip({ ownerUserId: CAPTAIN, tripId: t.id, reason: '' }), 'VALIDATION_FAILED');
    const v = env.svc.voidTrip({ ownerUserId: CAPTAIN, tripId: t.id, reason: 'duplicate entry' });
    assert.equal(v.status, 'VOIDED');
    assert.equal(env.svc.getTrip(CAPTAIN, t.id).voidReason, 'duplicate entry');
    rejects(() => env.svc.voidTrip({ ownerUserId: CAPTAIN, tripId: t.id, reason: 'again' }), 'CONFLICT');

    const { trip: t2 } = env.svc.recordTrip(trip(s.id, { key: 'key-0000000000002' }));
    env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s.id, endOdometerKm: 1100 });
    rejects(() => env.svc.voidTrip({ ownerUserId: CAPTAIN, tripId: t2.id, reason: 'late' }), 'CONFLICT');
  });
});

describe('corrections (DEC-06: append-only, reason, no reopen)', () => {
  function closedWithTrip() {
    const env = setup();
    const s = openShift(env, 1000);
    const { trip: t } = env.svc.recordTrip(trip(s.id));
    env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s.id, endOdometerKm: 1100 });
    return { env, s, t };
  }

  it('applies only to CLOSED shifts', () => {
    const env = setup();
    const s = openShift(env);
    rejects(
      () => env.svc.correct({ ownerUserId: CAPTAIN, shiftId: s.id, field: 'shift.end_odometer_km', newValue: 5, reason: 'x' }),
      'CONFLICT',
    );
    env.svc.cancelShift({ ownerUserId: CAPTAIN, shiftId: s.id, reason: 'oops' });
    rejects(
      () => env.svc.correct({ ownerUserId: CAPTAIN, shiftId: s.id, field: 'shift.end_odometer_km', newValue: 5, reason: 'x' }),
      'CONFLICT',
    );
  });

  it('requires a non-empty reason', () => {
    const { env, s } = closedWithTrip();
    rejects(
      () => env.svc.correct({ ownerUserId: CAPTAIN, shiftId: s.id, field: 'shift.end_odometer_km', newValue: 1120, reason: ' ' }),
      'VALIDATION_FAILED',
    );
  });

  it('keeps the original and exposes the corrected effective value', () => {
    const { env, s, t } = closedWithTrip();
    const c = env.svc.correct({
      ownerUserId: CAPTAIN,
      shiftId: s.id,
      field: 'trip.fare_minor',
      entityId: t.id,
      newValue: 16000,
      reason: 'typo in fare',
    });
    assert.equal(c.oldValue, 15000);
    assert.equal(c.newValue, 16000);
    assert.equal(env.svc.getTrip(CAPTAIN, t.id).fare.amountMinor, 15000); // الأصل لم يتغير
    assert.equal(env.svc.effectiveTrip(CAPTAIN, t.id).fare.amountMinor, 16000);

    env.svc.correct({ ownerUserId: CAPTAIN, shiftId: s.id, field: 'trip.fare_minor', entityId: t.id, newValue: 15500, reason: 'second fix' });
    assert.equal(env.svc.effectiveTrip(CAPTAIN, t.id).fare.amountMinor, 15500);
    assert.equal(env.svc.corrections(CAPTAIN, s.id).length, 2);
    assert.equal(env.svc.corrections(CAPTAIN, s.id)[1]?.oldValue, 16000);
  });

  it('corrects odometers with the end >= start invariant', () => {
    const { env, s } = closedWithTrip();
    rejects(
      () => env.svc.correct({ ownerUserId: CAPTAIN, shiftId: s.id, field: 'shift.end_odometer_km', newValue: 999, reason: 'x' }),
      'VALIDATION_FAILED',
    );
    env.svc.correct({ ownerUserId: CAPTAIN, shiftId: s.id, field: 'shift.end_odometer_km', newValue: 1150, reason: 'read wrong' });
    assert.equal(env.svc.effectiveShift(CAPTAIN, s.id).endOdometerKm, 1150);
    assert.equal(env.svc.getShift(CAPTAIN, s.id).endOdometerKm, 1100);
    rejects(
      () => env.svc.correct({ ownerUserId: CAPTAIN, shiftId: s.id, field: 'shift.start_odometer_km', newValue: 1151, reason: 'x' }),
      'VALIDATION_FAILED',
    );
  });

  it('voids a trip through a correction and rejects double voiding', () => {
    const { env, s, t } = closedWithTrip();
    env.svc.correct({ ownerUserId: CAPTAIN, shiftId: s.id, field: 'trip.status', entityId: t.id, newValue: 'VOIDED', reason: 'cancelled ride' });
    assert.equal(env.svc.effectiveTrip(CAPTAIN, t.id).status, 'VOIDED');
    rejects(
      () => env.svc.correct({ ownerUserId: CAPTAIN, shiftId: s.id, field: 'trip.status', entityId: t.id, newValue: 'VOIDED', reason: 'again' }),
      'CONFLICT',
    );
    rejects(
      () => env.svc.correct({ ownerUserId: CAPTAIN, shiftId: s.id, field: 'trip.status', entityId: t.id, newValue: 'RECORDED', reason: 'undo' }),
      'VALIDATION_FAILED',
    );
  });

  it('never reopens a shift: still CLOSED after corrections', () => {
    const { env, s } = closedWithTrip();
    env.svc.correct({ ownerUserId: CAPTAIN, shiftId: s.id, field: 'shift.end_odometer_km', newValue: 1120, reason: 'fix' });
    assert.equal(env.svc.effectiveShift(CAPTAIN, s.id).status, 'CLOSED');
    rejects(() => env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s.id, endOdometerKm: 1130 }), 'CONFLICT');
    rejects(() => env.svc.recordTrip(trip(s.id, { key: 'key-0000000late00' })), 'CONFLICT');
  });

  it("rejects another captain's shift or trip", () => {
    const { env, s, t } = closedWithTrip();
    rejects(
      () => env.svc.correct({ ownerUserId: OTHER, shiftId: s.id, field: 'trip.fare_minor', entityId: t.id, newValue: 1, reason: 'x' }),
      'NOT_FOUND',
    );
  });
});

describe('audit log and immutability', () => {
  it('records each state change with actor and reason, and is append-only', () => {
    const env = setup();
    const s = openShift(env);
    env.svc.endShift({ ownerUserId: CAPTAIN, shiftId: s.id, endOdometerKm: 1100 });
    env.svc.correct({ ownerUserId: CAPTAIN, shiftId: s.id, field: 'shift.end_odometer_km', newValue: 1110, reason: 'fix' });
    const log = env.svc.auditLog(CAPTAIN);
    assert.deepEqual(log.map((a) => a.action), ['vehicle.register', 'shift.start', 'shift.end', 'correction.append']);
    assert.equal(log[3]?.reason, 'fix');
    (log as unknown as unknown[]).length = 0; // تعديل النسخة المُرجَعة لا يمس السجل الداخلي
    assert.equal(env.svc.auditLog(CAPTAIN).length, 4);
    assert.throws(() => {
      (env.svc.auditLog(CAPTAIN)[0] as { action: string }).action = 'tampered';
    }, TypeError);
    assert.equal(env.svc.auditLog(OTHER).length, 0);
  });

  it('returned records are frozen', () => {
    const env = setup();
    const s = openShift(env);
    assert.equal(Object.isFrozen(s), true);
    assert.throws(() => {
      (s as { status: string }).status = 'CLOSED';
    }, TypeError);
  });
});
