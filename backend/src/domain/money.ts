import { validation } from './errors.ts';

/**
 * ADR-004 (PROPOSED) / DEC-09 (غير محسوم بعد): EGP وأعداد صحيحة بالقرش.
 * هذه الوحدة لا تحسب أي قاعدة مالية (DEC-03 محجوبة)؛ تتحقق من المدخلات فقط.
 */
export const CURRENCY = 'EGP' as const;
export type Currency = typeof CURRENCY;

export interface Money {
  readonly amountMinor: number;
  readonly currency: Currency;
}

/** يقبل عددًا صحيحًا آمنًا غير سالب فقط؛ يرفض الكسور والنصوص وNaN. */
export function money(amountMinor: unknown, field = 'amountMinor'): Money {
  if (typeof amountMinor !== 'number' || !Number.isSafeInteger(amountMinor)) {
    throw validation(`${field} must be an integer number of minor units`);
  }
  if (amountMinor < 0) {
    throw validation(`${field} must be >= 0`);
  }
  return Object.freeze({ amountMinor, currency: CURRENCY });
}
