import type { Money } from './money.ts';

export type ShiftStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';
export type TripStatus = 'RECORDED' | 'VOIDED';
/** القائمة PROPOSED — تأكيد الكابتن (قاموس البيانات). */
export const PLATFORMS = ['uber', 'didi', 'careem', 'indrive', 'other'] as const;
export type Platform = (typeof PLATFORMS)[number];

export interface Vehicle {
  readonly id: string;
  readonly ownerUserId: string;
  readonly label: string;
  readonly status: 'active';
}

export interface Shift {
  readonly id: string;
  readonly ownerUserId: string;
  readonly vehicleId: string;
  readonly status: ShiftStatus;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly operatingDate: string;
  readonly startOdometerKm: number;
  readonly endOdometerKm: number | null;
  readonly cancelReason: string | null;
}

export interface Trip {
  readonly id: string;
  readonly ownerUserId: string;
  readonly shiftId: string;
  readonly platform: Platform;
  readonly occurredAt: string;
  readonly fare: Money;
  readonly status: TripStatus;
  readonly voidReason: string | null;
}

export type CorrectableField =
  | 'trip.fare_minor'
  | 'trip.status'
  | 'shift.start_odometer_km'
  | 'shift.end_odometer_km';

/** DEC-06: سجل append-only؛ لا تعديل ولا حذف بعد الإضافة. */
export interface Correction {
  readonly id: string;
  readonly shiftId: string;
  readonly entityId: string;
  readonly field: CorrectableField;
  readonly oldValue: string | number;
  readonly newValue: string | number;
  readonly reason: string;
  readonly actorUserId: string;
  readonly createdAt: string;
}

export interface AuditEvent {
  readonly id: string;
  readonly actorUserId: string;
  readonly action: string;
  readonly entityType: 'vehicle' | 'shift' | 'trip';
  readonly entityId: string;
  readonly reason: string | null;
  readonly occurredAt: string;
}
