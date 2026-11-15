import { conflict, DomainError, notFound, validation } from './errors.ts';
import { money } from './money.ts';
import { operatingDate, parseIsoUtc } from './time.ts';
import type { Clock, IdGenerator } from './time.ts';
import { PLATFORMS } from './types.ts';
import type {
  AuditEvent,
  CorrectableField,
  Correction,
  Platform,
  Shift,
  Trip,
  Vehicle,
} from './types.ts';

function text(value: unknown, field: string, max = 500): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw validation(`${field} is required`);
  }
  const v = value.trim();
  if (v.length > max) {
    throw validation(`${field} is too long`);
  }
  return v;
}

function odometer(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw validation(`${field} must be a non-negative integer (km)`);
  }
  return value;
}

export interface FleetDeps {
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

export interface RecordTripInput {
  readonly ownerUserId: string;
  readonly shiftId: string;
  readonly platform: string;
  readonly occurredAt: string;
  readonly fareMinor: number;
  readonly idempotencyKey: string;
}

export interface CorrectionInput {
  readonly ownerUserId: string;
  readonly shiftId: string;
  readonly field: CorrectableField;
  /** معرّف الرحلة لحقول trip.*؛ يتجاهل لحقول shift.* (يُستخدم معرّف الشيفت). */
  readonly entityId?: string;
  readonly newValue: string | number;
  readonly reason: string;
}

/**
 * نواة النطاق (بلا HTTP ولا قاعدة بيانات). تنفّذ القرارات VERIFIED فقط:
 * DEC-01 مركبة واحدة، DEC-02 رحلة برحلة، DEC-04 يوم البدء بتوقيت القاهرة،
 * DEC-06 تصحيح append-only بلا حذف ولا إعادة فتح. لا قاعدة مالية (DEC-03 محجوبة).
 * التخزين في الذاكرة مؤقت لحين شريحة PostgreSQL.
 */
export class FleetService {
  readonly #clock: Clock;
  readonly #ids: IdGenerator;
  readonly #vehicles = new Map<string, Vehicle>();
  readonly #shifts = new Map<string, Shift>();
  readonly #trips = new Map<string, Trip>();
  readonly #corrections: Correction[] = [];
  readonly #audit: AuditEvent[] = [];
  readonly #idempotency = new Map<string, { fingerprint: string; tripId: string }>();

  constructor(deps: FleetDeps) {
    this.#clock = deps.clock;
    this.#ids = deps.ids;
  }

  #log(
    actor: string,
    action: string,
    entityType: AuditEvent['entityType'],
    entityId: string,
    reason: string | null = null,
  ): void {
    this.#audit.push(
      Object.freeze({
        id: this.#ids.next(),
        actorUserId: actor,
        action,
        entityType,
        entityId,
        reason,
        occurredAt: this.#clock.now().toISOString(),
      }),
    );
  }

  #ownedShift(owner: string, shiftId: string): Shift {
    const s = this.#shifts.get(shiftId);
    if (!s || s.ownerUserId !== owner) throw notFound('shift not found');
    return s;
  }

  #ownedTrip(owner: string, tripId: string): Trip {
    const t = this.#trips.get(tripId);
    if (!t || t.ownerUserId !== owner) throw notFound('trip not found');
    return t;
  }

  registerVehicle(ownerUserId: string, label: string): Vehicle {
    const clean = text(label, 'label', 60); // OpenAPI VehicleCreate.label maxLength 60
    for (const v of this.#vehicles.values()) {
      if (v.ownerUserId === ownerUserId && v.status === 'active') {
        throw conflict('one active vehicle per captain (DEC-01)');
      }
    }
    const vehicle: Vehicle = Object.freeze({
      id: this.#ids.next(),
      ownerUserId,
      label: clean,
      status: 'active' as const,
    });
    this.#vehicles.set(vehicle.id, vehicle);
    this.#log(ownerUserId, 'vehicle.register', 'vehicle', vehicle.id);
    return vehicle;
  }

  startShift(input: {
    ownerUserId: string;
    vehicleId: string;
    startOdometerKm: number;
  }): Shift {
    const km = odometer(input.startOdometerKm, 'startOdometerKm');
    const vehicle = this.#vehicles.get(input.vehicleId);
    if (!vehicle || vehicle.ownerUserId !== input.ownerUserId) throw notFound('vehicle not found');
    for (const s of this.#shifts.values()) {
      if (s.ownerUserId === input.ownerUserId && s.status === 'OPEN') {
        throw conflict('another shift is already open'); // T-SH-01 (قاعدة PROPOSED في STATE_MACHINES)
      }
    }
    const now = this.#clock.now();
    const shift: Shift = Object.freeze({
      id: this.#ids.next(),
      ownerUserId: input.ownerUserId,
      vehicleId: vehicle.id,
      status: 'OPEN' as const,
      startedAt: now.toISOString(),
      endedAt: null,
      operatingDate: operatingDate(now),
      startOdometerKm: km,
      endOdometerKm: null,
      cancelReason: null,
    });
    this.#shifts.set(shift.id, shift);
    this.#log(input.ownerUserId, 'shift.start', 'shift', shift.id);
    return shift;
  }

  endShift(input: { ownerUserId: string; shiftId: string; endOdometerKm: number }): Shift {
    const km = odometer(input.endOdometerKm, 'endOdometerKm');
    const s = this.#ownedShift(input.ownerUserId, input.shiftId);
    if (s.status !== 'OPEN') throw conflict(`shift is ${s.status}, cannot end`); // T-SH-03
    if (km < s.startOdometerKm) throw validation('end odometer must be >= start odometer'); // T-SH-02
    const ended: Shift = Object.freeze({
      ...s,
      status: 'CLOSED' as const,
      endedAt: this.#clock.now().toISOString(),
      endOdometerKm: km,
    });
    this.#shifts.set(ended.id, ended);
    this.#log(input.ownerUserId, 'shift.end', 'shift', ended.id);
    return ended;
  }

  cancelShift(input: { ownerUserId: string; shiftId: string; reason: string }): Shift {
    const reason = text(input.reason, 'reason');
    const s = this.#ownedShift(input.ownerUserId, input.shiftId);
    if (s.status !== 'OPEN') throw conflict(`shift is ${s.status}, cannot cancel`);
    const cancelled: Shift = Object.freeze({ ...s, status: 'CANCELLED' as const, cancelReason: reason });
    this.#shifts.set(cancelled.id, cancelled);
    this.#log(input.ownerUserId, 'shift.cancel', 'shift', cancelled.id, reason);
    return cancelled;
  }

  recordTrip(input: RecordTripInput): { trip: Trip; replayed: boolean } {
    const key = text(input.idempotencyKey, 'idempotencyKey', 128);
    if (key.length < 16) throw validation('idempotencyKey must be 16-128 characters'); // OpenAPI IdempotencyKey
    if (!(PLATFORMS as readonly string[]).includes(input.platform)) {
      throw validation(`platform must be one of: ${PLATFORMS.join(', ')}`);
    }
    const platform = input.platform as Platform;
    const fare = money(input.fareMinor, 'fareMinor');
    const occurredAt = parseIsoUtc(input.occurredAt, 'occurredAt').toISOString();
    const fingerprint = JSON.stringify([input.shiftId, platform, occurredAt, fare.amountMinor]);
    const scopedKey = `${input.ownerUserId}\u0000${key}`;

    const prior = this.#idempotency.get(scopedKey);
    if (prior) {
      if (prior.fingerprint !== fingerprint) {
        throw new DomainError('IDEMPOTENCY_KEY_REUSED', 'idempotency key reused with a different payload');
      }
      return { trip: this.#ownedTrip(input.ownerUserId, prior.tripId), replayed: true }; // T-IDEM-01
    }

    const shift = this.#ownedShift(input.ownerUserId, input.shiftId);
    if (shift.status !== 'OPEN') throw conflict('trips can only be recorded while the shift is OPEN');

    const trip: Trip = Object.freeze({
      id: this.#ids.next(),
      ownerUserId: input.ownerUserId,
      shiftId: shift.id,
      platform,
      occurredAt,
      fare,
      status: 'RECORDED' as const,
      voidReason: null,
    });
    this.#trips.set(trip.id, trip);
    this.#idempotency.set(scopedKey, { fingerprint, tripId: trip.id });
    this.#log(input.ownerUserId, 'trip.record', 'trip', trip.id);
    return { trip, replayed: false };
  }

  voidTrip(input: { ownerUserId: string; tripId: string; reason: string }): Trip {
    const reason = text(input.reason, 'reason');
    const t = this.#ownedTrip(input.ownerUserId, input.tripId);
    const shift = this.#ownedShift(input.ownerUserId, t.shiftId);
    if (shift.status !== 'OPEN') {
      throw conflict('shift is not OPEN: use a correction instead (DEC-06)');
    }
    if (t.status !== 'RECORDED') throw conflict('trip is already voided');
    const voided: Trip = Object.freeze({ ...t, status: 'VOIDED' as const, voidReason: reason });
    this.#trips.set(voided.id, voided);
    this.#log(input.ownerUserId, 'trip.void', 'trip', voided.id, reason);
    return voided;
  }

  /** DEC-06: تصحيح بعد الإغلاق فقط، بسبب إلزامي، يُضاف ولا يُعدَّل؛ الأصل يبقى كما هو. */
  correct(input: CorrectionInput): Correction {
    const reason = text(input.reason, 'reason');
    const shift = this.#ownedShift(input.ownerUserId, input.shiftId);
    if (shift.status !== 'CLOSED') throw conflict('corrections apply to CLOSED shifts only');

    let entityId: string;
    let oldValue: string | number;
    let newValue: string | number;

    switch (input.field) {
      case 'shift.end_odometer_km': {
        const eff = this.effectiveShift(input.ownerUserId, shift.id);
        newValue = odometer(input.newValue, 'newValue');
        if (newValue < eff.startOdometerKm) throw validation('end odometer must be >= start odometer');
        entityId = shift.id;
        oldValue = eff.endOdometerKm as number;
        break;
      }
      case 'shift.start_odometer_km': {
        const eff = this.effectiveShift(input.ownerUserId, shift.id);
        newValue = odometer(input.newValue, 'newValue');
        if (newValue > (eff.endOdometerKm as number)) {
          throw validation('start odometer must be <= end odometer');
        }
        entityId = shift.id;
        oldValue = eff.startOdometerKm;
        break;
      }
      case 'trip.fare_minor': {
        const trip = this.#ownedTrip(input.ownerUserId, text(input.entityId, 'entityId', 64));
        if (trip.shiftId !== shift.id) throw notFound('trip not found');
        newValue = money(input.newValue, 'newValue').amountMinor;
        entityId = trip.id;
        oldValue = this.effectiveTrip(input.ownerUserId, trip.id).fare.amountMinor;
        break;
      }
      case 'trip.status': {
        const trip = this.#ownedTrip(input.ownerUserId, text(input.entityId, 'entityId', 64));
        if (trip.shiftId !== shift.id) throw notFound('trip not found');
        if (input.newValue !== 'VOIDED') throw validation("trip.status can only be corrected to 'VOIDED'");
        const eff = this.effectiveTrip(input.ownerUserId, trip.id);
        if (eff.status !== 'RECORDED') throw conflict('trip is already voided');
        newValue = 'VOIDED';
        entityId = trip.id;
        oldValue = eff.status;
        break;
      }
      default:
        throw validation('unsupported correction field');
    }

    const correction: Correction = Object.freeze({
      id: this.#ids.next(),
      shiftId: shift.id,
      entityId,
      field: input.field,
      oldValue,
      newValue,
      reason,
      actorUserId: input.ownerUserId,
      createdAt: this.#clock.now().toISOString(),
    });
    this.#corrections.push(correction);
    this.#log(input.ownerUserId, 'correction.append', 'shift', shift.id, reason);
    return correction;
  }

  /** القيمة الفعّالة = الأصل + التصحيحات بالترتيب. الأصل لا يتغير أبدًا. */
  effectiveShift(ownerUserId: string, shiftId: string): Shift {
    const base = this.#ownedShift(ownerUserId, shiftId);
    let startKm = base.startOdometerKm;
    let endKm = base.endOdometerKm;
    for (const c of this.#corrections) {
      if (c.entityId !== shiftId) continue;
      if (c.field === 'shift.start_odometer_km') startKm = c.newValue as number;
      if (c.field === 'shift.end_odometer_km') endKm = c.newValue as number;
    }
    return Object.freeze({ ...base, startOdometerKm: startKm, endOdometerKm: endKm });
  }

  effectiveTrip(ownerUserId: string, tripId: string): Trip {
    const base = this.#ownedTrip(ownerUserId, tripId);
    let fare = base.fare;
    let status = base.status;
    for (const c of this.#corrections) {
      if (c.entityId !== tripId) continue;
      if (c.field === 'trip.fare_minor') fare = money(c.newValue);
      if (c.field === 'trip.status') status = 'VOIDED';
    }
    return Object.freeze({ ...base, fare, status });
  }

  /** الأصل بلا تصحيحات (للتدقيق). */
  getShift(ownerUserId: string, shiftId: string): Shift {
    return this.#ownedShift(ownerUserId, shiftId);
  }

  getTrip(ownerUserId: string, tripId: string): Trip {
    return this.#ownedTrip(ownerUserId, tripId);
  }

  corrections(ownerUserId: string, shiftId: string): readonly Correction[] {
    this.#ownedShift(ownerUserId, shiftId);
    return this.#corrections.filter((c) => c.shiftId === shiftId);
  }

  auditLog(ownerUserId: string): readonly AuditEvent[] {
    return this.#audit.filter((a) => a.actorUserId === ownerUserId);
  }
}
