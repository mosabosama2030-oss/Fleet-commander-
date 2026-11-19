/**
 * VOICE-001 (PROPOSED): من نص منطوق إلى نية. قواعد محلية بلا تكلفة، وفشلها آمن:
 * ما لا يُفهم بيقين يُرجَع `unknown` أو نية ناقصة الخانات فيسأل المساعد من جديد.
 * لا تنفّذ شيئًا؛ التنفيذ بعد التأكيد فقط (session.ts) وعبر نفس API.
 */
import { extractNumbers, hasArabic, tokens } from './numbers.ts';
import type { NumberHit } from './numbers.ts';

export type VoicePlatform = 'uber' | 'didi' | 'careem' | 'indrive' | 'other';

export type Intent =
  | { readonly kind: 'start_shift'; readonly startOdometerKm: number | null }
  | { readonly kind: 'end_shift'; readonly endOdometerKm: number | null }
  | { readonly kind: 'record_trip'; readonly platform: VoicePlatform | null; readonly fareMinor: number | null }
  | { readonly kind: 'void_last_trip' }
  | { readonly kind: 'query'; readonly what: 'shift_status' | 'trip_count' | 'income_today' }
  | { readonly kind: 'confirm_yes' }
  | { readonly kind: 'confirm_no' }
  | { readonly kind: 'unknown' };

export type ReplyLocale = 'ar-EG' | 'en';

export interface Parsed {
  readonly intent: Intent;
  /** لغة الرد: عربي ⇒ مصري، وإلا إنجليزي (قرار المنتج: الرد بلغة المتحدث، المصرية لا الفصحى). */
  readonly locale: ReplyLocale;
  /** أرقام رُصدت وبقيت غامضة (أكثر من رقم لخانة واحدة) ⇒ يسأل المساعد. */
  readonly ambiguousNumbers: boolean;
}

const has = (toks: readonly string[], words: readonly string[]): boolean => words.some((w) => toks.includes(w));
const hasPrefix = (toks: readonly string[], stems: readonly string[]): boolean =>
  toks.some((t) => stems.some((s) => t === s || t.startsWith(s)));

const SHIFT = ['شيفت', 'ورديه', 'وردايه', 'shift'];
const TRIP = ['رحله', 'رحلات', 'مشوار', 'مشاوير', 'توصيله', 'كورس', 'trip', 'trips', 'ride', 'rides', 'fare'];
const START = ['ابدا', 'ابتدي', 'ابتدا', 'افتح', 'بدا', 'بدايه', 'start', 'begin', 'open'];
const END = ['خلص', 'انهي', 'انهيت', 'اقفل', 'قفل', 'اغلق', 'قفلت', 'خلصت', 'end', 'close', 'finish', 'stop'];
const RECORD = ['سجل', 'ضيف', 'اضف', 'اضيف', 'زود', 'record', 'add', 'log'];
const VOID = ['الغي', 'الغا', 'امسح', 'احذف', 'cancel', 'void', 'delete', 'remove'];
const LAST = ['اخر', 'اخره', 'اخيره', 'last', 'latest', 'previous'];
const ODO = ['عداد', 'العداد', 'odometer', 'odo', 'كيلو', 'كم', 'km'];

const YES = ['نعم', 'ايوه', 'ايوا', 'اه', 'اها', 'تمام', 'اكد', 'اكدها', 'ماشي', 'صح', 'اوك', 'اوكي', 'yes', 'yeah', 'yep', 'confirm', 'ok', 'okay', 'sure', 'correct'];
const NO = ['لا', 'لأ', 'لاا', 'لاء', 'مش', 'الغي', 'بلاش', 'no', 'nope', 'cancel', 'stop', 'wrong'];

const PLATFORM_WORDS: ReadonlyArray<readonly [VoicePlatform, readonly string[]]> = [
  ['uber', ['uber', 'اوبر']],
  ['didi', ['didi', 'ديدي', 'دي', 'ديدى']],
  ['indrive', ['indrive', 'اندرايف', 'درايف']],
  ['careem', ['careem', 'كريم', 'كاريم']],
];

function platformFrom(toks: readonly string[]): VoicePlatform | null {
  const joined = toks.join(' ');
  if (/\bin\s*drive\b|ان درايف|إن درايف/.test(joined)) return 'indrive';
  for (const [p, words] of PLATFORM_WORDS) if (words.some((w) => toks.includes(w))) return p;
  if (has(toks, ['تاني', 'تانيه', 'other', 'اخري', 'كاش', 'cash'])) return 'other';
  return null;
}

/** رقم العداد: الرقم الذي يلي كلمة العداد مباشرة، وإلا الرقم الوحيد. أكثر من مرشح ⇒ غامض. */
function pickOdometer(toks: readonly string[], nums: readonly NumberHit[]): { value: number | null; ambiguous: boolean } {
  if (nums.length === 0) return { value: null, ambiguous: false };
  const odoIdx = toks.findIndex((t) => ODO.includes(t));
  if (odoIdx >= 0) {
    const after = nums.filter((n) => n.start > odoIdx);
    const before = nums.filter((n) => n.end < odoIdx);
    const cand = after.length > 0 ? after : before;
    if (cand.length === 1) return { value: (cand[0] as NumberHit).value, ambiguous: false };
    if (cand.length > 1) return { value: null, ambiguous: true };
  }
  if (nums.length === 1) return { value: (nums[0] as NumberHit).value, ambiguous: false };
  return { value: null, ambiguous: true };
}

/** العداد بالكيلومترات أعداد صحيحة فقط (قاعدة النواة)؛ كسر ⇒ لا قيمة ويُسأل المستخدم. */
const asKm = (v: number | null): number | null => (v !== null && Number.isSafeInteger(v) && v >= 0 ? v : null);

/** المبلغ بالقروش: ضرب في 100 وتقريب، ويُرفض ما لا يقع على قرش صحيح (مثل 85.555). */
function asMinor(v: number | null): number | null {
  if (v === null || v < 0) return null;
  const minor = Math.round(v * 100);
  return Math.abs(minor - v * 100) < 1e-6 && Number.isSafeInteger(minor) ? minor : null;
}

/** يزيل «ال» التعريف لمطابقة الكلمات المفتاحية فقط (لا الأرقام: «الف» «الفين» «الاف» تبقى). */
const NUMBER_AL = new Set(['الفين', 'الاف', 'الفان', 'الف', 'الغي', 'الغا']); // أرقام وفعل «الغي» (ليس تعريفًا)
const stripAl = (t: string): string => (t.length > 3 && t.startsWith('ال') && !NUMBER_AL.has(t) ? t.slice(2) : t);

export function parseUtterance(text: string): Parsed {
  const rawToks = tokens(text);
  const toks = rawToks.map(stripAl);
  const locale: ReplyLocale = hasArabic(text) ? 'ar-EG' : 'en';
  const done = (intent: Intent, ambiguousNumbers = false): Parsed => ({ intent, locale, ambiguousNumbers });
  if (toks.length === 0) return done({ kind: 'unknown' });

  const yes = has(toks, YES);
  const no = has(toks, NO);
  const shift = has(toks, SHIFT);
  const trip = has(toks, TRIP);
  const nums = extractNumbers(rawToks);

  // أوامر صريحة تُقدَّم على نعم/لا (قد تحوي «الغي» وهي أيضًا إلغاء).
  if (has(toks, VOID) && trip && (has(toks, LAST) || toks.length <= 4)) return done({ kind: 'void_last_trip' });

  if (shift && hasPrefix(toks, START) && !hasPrefix(toks, END)) {
    const o = pickOdometer(toks, nums);
    return done({ kind: 'start_shift', startOdometerKm: asKm(o.value) }, o.ambiguous);
  }
  if (shift && hasPrefix(toks, END)) {
    const o = pickOdometer(toks, nums);
    return done({ kind: 'end_shift', endOdometerKm: asKm(o.value) }, o.ambiguous);
  }
  if (trip && (has(toks, RECORD) || nums.length > 0 || platformFrom(toks) !== null)) {
    const fareNums = nums.length > 0 ? nums : [];
    const ambiguous = fareNums.length > 1;
    const fare = fareNums.length === 1 ? asMinor((fareNums[0] as NumberHit).value) : null;
    return done({ kind: 'record_trip', platform: platformFrom(toks), fareMinor: fare }, ambiguous);
  }

  // استعلامات للقراءة فقط
  if (has(toks, ['كام', 'how', 'what', 'ايه', 'اي', 'عدد', 'مجموع', 'total', 'count', 'status', 'حاله'])) {
    if (trip && has(toks, ['كام', 'عدد', 'how', 'count', 'many'])) return done({ kind: 'query', what: 'trip_count' });
    if (hasPrefix(toks, ['دخل', 'ايراد', 'فلوس', 'كسب', 'ربح']) || has(toks, ['income', 'earned', 'earnings', 'revenue']))
      return done({ kind: 'query', what: 'income_today' });
    if (shift || has(toks, ['status', 'حاله'])) return done({ kind: 'query', what: 'shift_status' });
  }
  if ((hasPrefix(toks, ['دخل', 'كسب']) || has(toks, ['income', 'earned', 'earnings'])) && has(toks, ['انهارده', 'نهارده', 'يوم', 'today']))
    return done({ kind: 'query', what: 'income_today' });

  // تأكيد/رفض (بعد الأوامر). تعارض نعم ولا معًا ⇒ لا نفهم.
  if (yes && no) return done({ kind: 'unknown' });
  if (yes && toks.length <= 4) return done({ kind: 'confirm_yes' });
  if (no && toks.length <= 4) return done({ kind: 'confirm_no' });
  return done({ kind: 'unknown' });
}
