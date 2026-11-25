import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  FleetService,
  VoiceSession,
  extractNumbers,
  formatPounds,
  normalize,
  parseUtterance,
  resultReply,
  tokens,
} from '../src/index.ts';
import type { Intent, VoiceAction } from '../src/index.ts';

const nums = (s: string) => extractNumbers(tokens(s)).map((h) => h.value);
const kind = (s: string): Intent => parseUtterance(s).intent;

describe('voice: normalize / numbers', () => {
  it('normalizes Arabic-Indic digits, diacritics, alef/ya/ta marbuta', () => {
    assert.equal(normalize('ابْدَأ الشِّيفت ١٢٠٠٠'), 'ابدا الشيفت 12000');
    assert.equal(normalize('٨٥٫٥'), '85.5');
    assert.equal(normalize('1,200'), '1200');
    assert.equal(normalize('رحلة'), 'رحله');
  });
  it('digits in all scripts', () => {
    assert.deepEqual(nums('٨٥ جنيه'), [85]);
    assert.deepEqual(nums('85.5'), [85.5]);
    assert.deepEqual(nums('۱۲۰۰۰'), [12000]);
    assert.deepEqual(nums('12,000 km'), [12000]);
  });
  it('Egyptian and MSA number words', () => {
    const cases: Array<[string, number]> = [
      ['تمانين', 80], ['ثمانين', 80], ['خمسين', 50], ['ميه', 100], ['ميت جنيه', 100],
      ['ميتين وخمسين', 250], ['تلتميه وخمسه وعشرين', 325], ['ثمانية وسبعين', 78],
      ['اتنين وتلاتين', 32], ['حداشر', 11], ['تسعتاشر', 19], ['الف', 1000], ['الف ومية', 1100],
      ['الفين وخمسمية', 2500], ['تلات تلاف وخمسمية', 3500], ['تلات ميه', 300], ['خمسين ونص', 50.5],
      ['بتمانين', 80], ['بخمسين', 50],
    ];
    for (const [s, v] of cases) assert.deepEqual(nums(s), [v], s);
  });
  it('English number words', () => {
    assert.deepEqual(nums('eighty five'), [85]);
    assert.deepEqual(nums('two hundred and ten'), [210]);
    assert.deepEqual(nums('a thousand'), [1000]);
    assert.deepEqual(nums('one thousand two hundred'), [1200]);
  });
  it('two adjacent numbers stay two numbers (never merged)', () => {
    assert.deepEqual(nums('خمسه تمانين'), [5, 80]);
    assert.deepEqual(nums('٨٥ و٩٠'), [85, 90]);
    assert.deepEqual(nums('ميتين خمسين'), [200, 50]); // بلا «و» ⇒ رقمان، لا 250 مخمَّنة
    assert.deepEqual(nums('عشرين خمسه'), [20, 5]);
    assert.deepEqual(nums('ميتين و خمسين'), [250]); // «و» منفصلة
    assert.deepEqual(nums('الف ومية'), [1100]);
  });
});

describe('voice: intents in Egyptian / MSA / English', () => {
  it('start shift with odometer', () => {
    assert.deepEqual(kind('ابدأ الشيفت العداد ١٢٠٠٠'), { kind: 'start_shift', startOdometerKm: 12000 });
    assert.deepEqual(kind('افتح وردية عداد اتنين وتلاتين الف'), { kind: 'start_shift', startOdometerKm: 32000 });
    assert.deepEqual(kind('start my shift odometer 45200'), { kind: 'start_shift', startOdometerKm: 45200 });
  });
  it('end shift', () => {
    assert.deepEqual(kind('خلصت الشيفت'), { kind: 'end_shift', endOdometerKm: null });
    assert.deepEqual(kind('اقفل الشيفت العداد ٤٥٣١٠'), { kind: 'end_shift', endOdometerKm: 45310 });
    assert.deepEqual(kind('end shift 45310'), { kind: 'end_shift', endOdometerKm: 45310 });
  });
  it('record trip: platform and fare in minor units', () => {
    assert.deepEqual(kind('سجل رحلة اوبر بتمانين جنيه'), { kind: 'record_trip', platform: 'uber', fareMinor: 8000 });
    assert.deepEqual(kind('سجّل مشوار ديدي ٨٥ جنيه'), { kind: 'record_trip', platform: 'didi', fareMinor: 8500 });
    assert.deepEqual(kind('ضيف كورس كريم ميتين جنيه'), { kind: 'record_trip', platform: 'careem', fareMinor: 20000 });
    assert.deepEqual(kind('سجل مشوار ان درايف بخمسين ونص'), { kind: 'record_trip', platform: 'indrive', fareMinor: 5050 });
    assert.deepEqual(kind('record an Uber trip for eighty five pounds'), { kind: 'record_trip', platform: 'uber', fareMinor: 8500 });
    assert.deepEqual(kind('log a careem ride 120'), { kind: 'record_trip', platform: 'careem', fareMinor: 12000 });
  });
  it('void last trip; yes/no; queries', () => {
    assert.deepEqual(kind('الغي اخر رحلة'), { kind: 'void_last_trip' });
    assert.deepEqual(kind('cancel the last trip'), { kind: 'void_last_trip' });
    assert.equal(kind('ايوه تمام').kind, 'confirm_yes');
    assert.equal(kind('لا').kind, 'confirm_no');
    assert.equal(kind('yes').kind, 'confirm_yes');
    assert.deepEqual(kind('كام رحلة النهارده'), { kind: 'query', what: 'trip_count' });
    assert.deepEqual(kind('انا دخلي كام النهارده'), { kind: 'query', what: 'income_today' });
    assert.deepEqual(kind('how many trips today'), { kind: 'query', what: 'trip_count' });
  });
  it('reply language follows the speaker; Arabic ⇒ Egyptian', () => {
    assert.equal(parseUtterance('ابدأ الشيفت').locale, 'ar-EG');
    assert.equal(parseUtterance('start shift').locale, 'en');
  });
  it('fails safe: contradictions, chatter, fractions, ambiguity', () => {
    assert.equal(kind('ايوه لا').kind, 'unknown');
    assert.equal(kind('مرحبا ازيك').kind, 'unknown');
    assert.equal(kind('').kind, 'unknown');
    assert.deepEqual(kind('سجل رحلة اوبر 85.555'), { kind: 'record_trip', platform: 'uber', fareMinor: null });
    assert.deepEqual(kind('ابدأ الشيفت العداد 100.5'), { kind: 'start_shift', startOdometerKm: null });
    const p = parseUtterance('سجل رحلة كريم ٨٥ و٩٠');
    assert.equal(p.ambiguousNumbers, true);
    assert.deepEqual(p.intent, { kind: 'record_trip', platform: 'careem', fareMinor: null });
  });
});

function session(startMs = 0) {
  let t = startMs;
  return { s: new VoiceSession(() => t), advance: (ms: number) => (t += ms) };
}

describe('voice: session safety rules', () => {
  it('rule 1: nothing runs without an explicit yes after read-back', () => {
    const { s } = session();
    const r1 = s.handle('سجل رحلة اوبر بتمانين جنيه');
    assert.equal(r1.action, null);
    assert.equal(r1.reply.text, 'هسجّل رحلة أوبر بـ 80 جنيه. أأكّد؟');
    const r2 = s.handle('ايوه');
    assert.deepEqual(r2.action, { kind: 'record_trip', platform: 'uber', fareMinor: 8000 });
    assert.equal(r2.reply.text, 'ثانية واحدة، بنفّذ.'); // قاعدة 4: لا ادعاء نجاح
    assert.equal(s.handle('ايوه').action, null); // التنفيذ مرة واحدة فقط
  });
  it('a no cancels; a yes with nothing pending does nothing', () => {
    const { s } = session();
    s.handle('start shift 45200');
    const r = s.handle('no');
    assert.equal(r.action, null);
    assert.equal(s.handle('yes').action, null);
    assert.equal(s.handle('yes').reply.text, 'There is nothing pending to confirm.');
  });
  it('confirmation expires after the TTL', () => {
    const { s, advance } = session();
    s.handle('ابدأ الشيفت العداد ١٢٠٠٠');
    advance(20_001);
    const r = s.handle('ايوه');
    assert.equal(r.action, null);
    assert.equal(r.reply.text, 'المهلة خلصت. قول الأمر تاني من فضلك.');
  });
  it('rule 2: missing slots are asked, never guessed (platform, then fare)', () => {
    const { s } = session();
    assert.match(s.handle('سجل رحلة').reply.text, /أنهي تطبيق/);
    assert.match(s.handle('كريم').reply.text, /كام الأجرة/);
    assert.equal(s.handle('خمسه وسبعين').reply.text, 'هسجّل رحلة كريم بـ 75 جنيه. أأكّد؟');
    assert.deepEqual(s.handle('تمام').action, { kind: 'record_trip', platform: 'careem', fareMinor: 7500 });
  });
  it('an ambiguous number is re-asked and not silently picked', () => {
    const { s } = session();
    assert.match(s.handle('سجل رحلة اوبر ٨٥ و٩٠').reply.text, /أكتر من رقم/);
    assert.match(s.handle('٩٠ جنيه').reply.text, /90 جنيه/);
    assert.deepEqual(s.handle('نعم').action, { kind: 'record_trip', platform: 'uber', fareMinor: 9000 });
  });
  it('a digits-only answer keeps the conversation language', () => {
    const { s } = session();
    s.handle('ابدأ الشيفت');
    assert.equal(s.handle('12000').reply.locale, 'ar-EG');
    const e = session();
    e.s.handle('start shift');
    assert.equal(e.s.handle('12000').reply.locale, 'en');
  });
  it('a fractional odometer answer is rejected', () => {
    const { s } = session();
    s.handle('ابدأ الشيفت');
    assert.match(s.handle('100.5').reply.text, /كسر/);
    assert.match(s.handle('12000').reply.text, /12000/);
  });
  it('a new command replaces an old pending one (still needs its own yes)', () => {
    const { s } = session();
    s.handle('سجل رحلة اوبر 50');
    const r = s.handle('خلصت الشيفت العداد 45310');
    assert.equal(r.action, null);
    assert.deepEqual(s.handle('yes').action, { kind: 'end_shift', endOdometerKm: 45310 });
  });
  it('replies in the language spoken, per turn', () => {
    const { s } = session();
    const r = s.handle('record an Uber trip for eighty five pounds');
    assert.equal(r.reply.locale, 'en');
    assert.equal(r.reply.text, "I'll record a Uber trip for 85 pounds. Confirm?");
  });
  it('rule 3: answers come from context only; missing context ⇒ unavailable, never an estimate', () => {
    const { s } = session();
    assert.equal(s.handle('انا دخلي كام النهارده').reply.text, 'الرقم ده مش متاح دلوقتي.');
    assert.equal(s.handle('انا دخلي كام النهارده', { incomeTodayMinor: 123450 }).reply.text, 'دخلك النهارده 1234.5 جنيه.');
    assert.equal(s.handle('كام رحلة النهارده', { tripCount: 7 }).reply.text, 'عدد الرحلات 7.');
    assert.equal(s.handle('how many trips today').reply.text, "That number isn't available right now.");
  });
  it('rule 4: success is spoken only through resultReply', () => {
    assert.equal(resultReply(true, 'ar-EG').text, 'تمام، اتنفّذت.');
    assert.equal(resultReply(false, 'en').text, "I couldn't do that. Please check the screen.");
  });
  it('formatPounds', () => {
    assert.equal(formatPounds(8500), '85');
    assert.equal(formatPounds(8550), '85.5');
    assert.equal(formatPounds(8505), '85.05');
    assert.equal(formatPounds(5), '0.05');
  });
});

describe('voice: end to end with the domain core', () => {
  it('a confirmed voice action drives FleetService with one idempotency key', () => {
    let n = 0;
    const svc = new FleetService({ clock: { now: () => new Date('2026-11-14T08:00:00Z') }, ids: { next: () => `id-${++n}` } });
    const v = svc.registerVehicle('cap', 'Car');
    const { s } = session();

    const run = (a: VoiceAction, key: string) => {
      if (a.kind === 'start_shift') return svc.startShift({ ownerUserId: 'cap', vehicleId: v.id, startOdometerKm: a.startOdometerKm, idempotencyKey: key });
      throw new Error('unexpected');
    };
    s.handle('ابدأ الشيفت العداد ١٢٠٠٠');
    const act = s.handle('ايوه').action as VoiceAction;
    const key = 'voice-confirm-0001-abcd';
    const shift = run(act, key);
    assert.equal(shift.startOdometerKm, 12000);
    // إعادة المحاولة بنفس المفتاح بعد انقطاع الشبكة لا تكرر الشيفت
    assert.equal(run(act, key).id, shift.id);
    assert.equal(svc.listShifts('cap').items.length, 1);

    s.handle('سجل رحلة اوبر ميتين وخمسين جنيه');
    const trip = s.handle('تمام').action as VoiceAction;
    assert.equal(trip.kind, 'record_trip');
    if (trip.kind === 'record_trip') {
      const r = svc.recordTrip({ ownerUserId: 'cap', shiftId: shift.id, platform: trip.platform, occurredAt: '2026-11-14T09:00:00Z', fareMinor: trip.fareMinor, idempotencyKey: 'voice-trip-0001-abcd' });
      assert.equal(r.trip.fare.amountMinor, 25000);
    }
  });
});
