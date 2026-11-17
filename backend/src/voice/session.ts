/**
 * VOICE-001 (PROPOSED): جلسة محادثة صوتية — آلة حالة نقية.
 * قواعد السلامة (مصدرها قرار المنتج + FIN-1.0 + NFR-003):
 *  1. لا يُنفَّذ أي تغيير بلا تأكيد صريح بعد قراءة القيم بصوت عالٍ.
 *  2. المبالغ والعدادات تأتي من كلام المستخدم فقط ولا تُخمَّن؛ الناقص يُسأل عنه.
 *  3. الإجابات عن الدخل والأعداد تأتي من `VoiceContext` (نتيجة API/محرك الحسابات)؛ غيابها ⇒ «مش متاح» لا تقدير.
 *  4. لا ردّ نجاح قبل 2xx: ردّ التأكيد يقول «بنفّذ»، و`resultReply` وحدها تُنطق بعد نتيجة API.
 *  5. التنفيذ بعدها يمرّ بنفس API بـ`Idempotency-Key` واحد لكل تأكيد (مسؤولية المستدعي).
 */
import { parseUtterance } from './intents.ts';
import type { Intent, ReplyLocale, VoicePlatform } from './intents.ts';
import { extractNumbers, tokens } from './numbers.ts';

export type VoiceAction =
  | { readonly kind: 'start_shift'; readonly startOdometerKm: number }
  | { readonly kind: 'end_shift'; readonly endOdometerKm: number }
  | { readonly kind: 'record_trip'; readonly platform: VoicePlatform; readonly fareMinor: number }
  | { readonly kind: 'void_last_trip' };

export interface VoiceContext {
  readonly shiftStatus?: 'NONE' | 'OPEN' | 'CLOSED';
  readonly tripCount?: number;
  /** من محرك الحسابات (FIN-1.0) حين يوجد؛ غيابه يعني «مش متاح». */
  readonly incomeTodayMinor?: number;
}

export interface Reply {
  readonly text: string;
  readonly locale: ReplyLocale;
}

export interface TurnResult {
  readonly reply: Reply;
  /** يُملأ مرة واحدة فقط: بعد «نعم» على نية مكتملة ومعلّقة. التنفيذ على المستدعي. */
  readonly action: VoiceAction | null;
}

type Draft =
  | { kind: 'start_shift'; startOdometerKm: number | null }
  | { kind: 'end_shift'; endOdometerKm: number | null }
  | { kind: 'record_trip'; platform: VoicePlatform | null; fareMinor: number | null }
  | { kind: 'void_last_trip' };

const PLATFORM_NAME: Record<VoicePlatform, Record<ReplyLocale, string>> = {
  uber: { 'ar-EG': 'أوبر', en: 'Uber' },
  didi: { 'ar-EG': 'ديدي', en: 'DiDi' },
  careem: { 'ar-EG': 'كريم', en: 'Careem' },
  indrive: { 'ar-EG': 'إن درايف', en: 'inDrive' },
  other: { 'ar-EG': 'تاني', en: 'other' },
};

/** قروش ⇒ نص جنيه بلا أصفار زائدة: 8500→"85"، 8550→"85.5"، 8505→"85.05". */
export function formatPounds(minor: number): string {
  const whole = Math.floor(minor / 100);
  const frac = minor % 100;
  if (frac === 0) return String(whole);
  return `${whole}.${String(frac).padStart(2, '0').replace(/0$/, '')}`;
}

const T = {
  'ar-EG': {
    didntGet: 'ماسمعتش كويس، ممكن تعيد؟',
    askPlatform: 'الرحلة دي على أنهي تطبيق؟ أوبر ولا كريم ولا ديدي ولا إن درايف؟',
    askFare: 'كام الأجرة بالجنيه؟',
    askStartKm: 'العداد كام؟',
    askEndKm: 'العداد كام عند الإنهاء؟',
    ambiguous: 'سمعت أكتر من رقم. قولّي الرقم المطلوب بس.',
    fraction: 'الرقم ده فيه كسر مش مقبول هنا. قوله تاني بأرقام صحيحة.',
    start: (km: number) => `هبدأ الشيفت والعداد ${km}. أأكّد؟`,
    end: (km: number) => `هقفل الشيفت والعداد ${km}. أأكّد؟`,
    trip: (p: string, f: string) => `هسجّل رحلة ${p} بـ ${f} جنيه. أأكّد؟`,
    voidLast: 'هلغي آخر رحلة. أأكّد؟',
    working: 'ثانية واحدة، بنفّذ.',
    cancelled: 'تمام، ما اتنفذش حاجة.',
    nothing: 'مفيش حاجة معلّقة أأكّدها.',
    expired: 'المهلة خلصت. قول الأمر تاني من فضلك.',
    unavailable: 'الرقم ده مش متاح دلوقتي.',
    shiftNone: 'مفيش شيفت مفتوح.',
    shiftOpen: 'عندك شيفت مفتوح.',
    shiftClosed: 'آخر شيفت اتقفل.',
    trips: (n: number) => `عدد الرحلات ${n}.`,
    income: (f: string) => `دخلك النهارده ${f} جنيه.`,
    ok: 'تمام، اتنفّذت.',
    fail: 'ماقدرتش أنفّذ. شوف الشاشة.',
  },
  en: {
    didntGet: "Sorry, I didn't catch that. Could you repeat?",
    askPlatform: 'Which app was this trip on? Uber, Careem, DiDi or inDrive?',
    askFare: 'What was the fare in pounds?',
    askStartKm: 'What is the odometer reading?',
    askEndKm: 'What is the odometer reading now?',
    ambiguous: 'I heard more than one number. Please say just the one I asked for.',
    fraction: "That number has a fraction, which isn't allowed here. Please say a whole number.",
    start: (km: number) => `I'll start the shift at ${km} km. Confirm?`,
    end: (km: number) => `I'll end the shift at ${km} km. Confirm?`,
    trip: (p: string, f: string) => `I'll record a ${p} trip for ${f} pounds. Confirm?`,
    voidLast: "I'll void the last trip. Confirm?",
    working: 'One moment, working on it.',
    cancelled: "Okay, nothing was done.",
    nothing: 'There is nothing pending to confirm.',
    expired: 'That timed out. Please say the command again.',
    unavailable: "That number isn't available right now.",
    shiftNone: 'There is no open shift.',
    shiftOpen: 'You have an open shift.',
    shiftClosed: 'Your last shift is closed.',
    trips: (n: number) => `You have ${n} trips.`,
    income: (f: string) => `Your income today is ${f} pounds.`,
    ok: 'Done.',
    fail: "I couldn't do that. Please check the screen.",
  },
} as const;

/** النطق بعد نتيجة API فقط (قاعدة 4). */
export function resultReply(ok: boolean, locale: ReplyLocale): Reply {
  return { text: ok ? T[locale].ok : T[locale].fail, locale };
}

export class VoiceSession {
  readonly #now: () => number;
  readonly #ttlMs: number;
  #draft: Draft | null = null;
  #pending: { action: VoiceAction; at: number } | null = null;
  /** الخانة التي ينتظرها المساعد الآن (لقبول «ثمانين» وحدها كجواب). */
  #asking: 'platform' | 'fare' | 'startKm' | 'endKm' | null = null;
  /** لغة آخر كلام فيه حروف؛ الأرقام وحدها («١٢٠٠٠») لا تغيّر لغة المحادثة. */
  #lastLocale: ReplyLocale | null = null;

  constructor(now: () => number, ttlMs = 20_000) {
    this.#now = now;
    this.#ttlMs = ttlMs;
  }

  handle(transcript: string, ctx: VoiceContext = {}): TurnResult {
    const parsed = parseUtterance(transcript);
    const hasLetters = /\p{L}/u.test(transcript);
    const locale: ReplyLocale = hasLetters ? parsed.locale : (this.#lastLocale ?? parsed.locale);
    if (hasLetters) this.#lastLocale = parsed.locale;
    const say = (text: string, action: VoiceAction | null = null): TurnResult => ({ reply: { text, locale }, action });
    const t = T[locale];

    if (this.#pending && this.#now() - this.#pending.at > this.#ttlMs) {
      this.#pending = null;
      if (parsed.intent.kind === 'confirm_yes') return say(t.expired);
    }

    const intent = parsed.intent;

    if (intent.kind === 'confirm_yes') {
      if (!this.#pending) return say(this.#asking ? this.#questionFor(locale) : t.nothing);
      const action = this.#pending.action;
      this.#pending = null;
      this.#draft = null;
      this.#asking = null;
      return say(t.working, action);
    }
    if (intent.kind === 'confirm_no') {
      const had = this.#pending !== null || this.#draft !== null;
      this.#pending = null;
      this.#draft = null;
      this.#asking = null;
      return say(had ? t.cancelled : t.nothing);
    }

    if (intent.kind === 'query') return say(this.#answer(intent, ctx, locale));

    // إجابة قصيرة لخانة معلّقة («ثمانين» أو «أوبر») بدل أمر كامل
    if (intent.kind === 'unknown' && this.#draft && this.#asking) return this.#fillSlot(transcript, locale);

    if (intent.kind === 'unknown') return say(t.didntGet);

    // أمر جديد يستبدل أي مسودة/تأكيد قديم
    this.#pending = null;
    this.#asking = null;
    this.#draft = this.#toDraft(intent);
    if (parsed.ambiguousNumbers) {
      this.#clearNumericSlots();
      this.#asking = this.#nextAsk();
      return say(t.ambiguous);
    }
    return this.#advance(locale);
  }

  // ───────── داخلي ─────────

  #toDraft(intent: Intent): Draft {
    switch (intent.kind) {
      case 'start_shift':
        return { kind: 'start_shift', startOdometerKm: intent.startOdometerKm };
      case 'end_shift':
        return { kind: 'end_shift', endOdometerKm: intent.endOdometerKm };
      case 'record_trip':
        return { kind: 'record_trip', platform: intent.platform, fareMinor: intent.fareMinor };
      default:
        return { kind: 'void_last_trip' };
    }
  }

  #clearNumericSlots(): void {
    const d = this.#draft;
    if (!d) return;
    if (d.kind === 'record_trip') d.fareMinor = null;
    if (d.kind === 'start_shift') d.startOdometerKm = null;
    if (d.kind === 'end_shift') d.endOdometerKm = null;
  }

  #nextAsk(): 'platform' | 'fare' | 'startKm' | 'endKm' | null {
    const d = this.#draft;
    if (!d) return null;
    if (d.kind === 'record_trip') return d.platform === null ? 'platform' : d.fareMinor === null ? 'fare' : null;
    if (d.kind === 'start_shift') return d.startOdometerKm === null ? 'startKm' : null;
    if (d.kind === 'end_shift') return d.endOdometerKm === null ? 'endKm' : null;
    return null;
  }

  #questionFor(locale: ReplyLocale): string {
    const t = T[locale];
    switch (this.#asking) {
      case 'platform': return t.askPlatform;
      case 'fare': return t.askFare;
      case 'startKm': return t.askStartKm;
      case 'endKm': return t.askEndKm;
      default: return t.didntGet;
    }
  }

  /** اسأل عن أول خانة ناقصة، أو اطلب التأكيد إن اكتملت. */
  #advance(locale: ReplyLocale): TurnResult {
    const d = this.#draft as Draft;
    const t = T[locale];
    this.#asking = this.#nextAsk();
    if (this.#asking) return { reply: { text: this.#questionFor(locale), locale }, action: null };

    let action: VoiceAction;
    let prompt: string;
    switch (d.kind) {
      case 'start_shift':
        action = { kind: 'start_shift', startOdometerKm: d.startOdometerKm as number };
        prompt = t.start(action.startOdometerKm);
        break;
      case 'end_shift':
        action = { kind: 'end_shift', endOdometerKm: d.endOdometerKm as number };
        prompt = t.end(action.endOdometerKm);
        break;
      case 'record_trip': {
        const platform = d.platform as VoicePlatform;
        const fareMinor = d.fareMinor as number;
        action = { kind: 'record_trip', platform, fareMinor };
        prompt = t.trip(PLATFORM_NAME[platform][locale], formatPounds(fareMinor));
        break;
      }
      default:
        action = { kind: 'void_last_trip' };
        prompt = t.voidLast;
    }
    this.#pending = { action, at: this.#now() };
    return { reply: { text: prompt, locale }, action: null };
  }

  #fillSlot(transcript: string, locale: ReplyLocale): TurnResult {
    const d = this.#draft as Draft;
    const t = T[locale];
    const toks = tokens(transcript);
    const nums = extractNumbers(toks);
    if (this.#asking === 'platform' && d.kind === 'record_trip') {
      const p = parseUtterance(`سجل رحلة ${transcript}`).intent;
      if (p.kind === 'record_trip' && p.platform !== null) {
        d.platform = p.platform;
        return this.#advance(locale);
      }
      return { reply: { text: t.askPlatform, locale }, action: null };
    }
    if (nums.length !== 1) {
      return { reply: { text: nums.length > 1 ? t.ambiguous : this.#questionFor(locale), locale }, action: null };
    }
    const v = (nums[0] as { value: number }).value;
    if (this.#asking === 'fare' && d.kind === 'record_trip') {
      const minor = Math.round(v * 100);
      if (v < 0 || Math.abs(minor - v * 100) > 1e-6) return { reply: { text: t.fraction, locale }, action: null };
      d.fareMinor = minor;
    } else if (this.#asking === 'startKm' && d.kind === 'start_shift') {
      if (!Number.isSafeInteger(v) || v < 0) return { reply: { text: t.fraction, locale }, action: null };
      d.startOdometerKm = v;
    } else if (this.#asking === 'endKm' && d.kind === 'end_shift') {
      if (!Number.isSafeInteger(v) || v < 0) return { reply: { text: t.fraction, locale }, action: null };
      d.endOdometerKm = v;
    }
    return this.#advance(locale);
  }

  #answer(intent: Extract<Intent, { kind: 'query' }>, ctx: VoiceContext, locale: ReplyLocale): string {
    const t = T[locale];
    if (intent.what === 'trip_count') return ctx.tripCount === undefined ? t.unavailable : t.trips(ctx.tripCount);
    if (intent.what === 'income_today')
      return ctx.incomeTodayMinor === undefined ? t.unavailable : t.income(formatPounds(ctx.incomeTodayMinor));
    if (ctx.shiftStatus === undefined) return t.unavailable;
    return ctx.shiftStatus === 'OPEN' ? t.shiftOpen : ctx.shiftStatus === 'CLOSED' ? t.shiftClosed : t.shiftNone;
  }
}
