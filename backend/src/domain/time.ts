import { validation } from './errors.ts';

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}

export const systemClock: Clock = { now: () => new Date() };

const CAIRO_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Cairo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * DEC-04 (VERIFIED): الشيفت ينسب ليوم البدء بتوقيت Africa/Cairo، ولا فرق ليل/نهار.
 * التخزين UTC، والاستخراج هنا فقط. يعتمد على بيانات ICU في Node (تغيّر التوقيت الصيفي في مصر).
 */
export function operatingDate(startedAt: Date): string {
  return CAIRO_DATE.format(startedAt);
}

export function parseIsoUtc(value: unknown, field: string): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(value)) {
    throw validation(`${field} must be an ISO-8601 UTC timestamp ending with Z`);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw validation(`${field} is not a valid date`);
  }
  return d;
}
