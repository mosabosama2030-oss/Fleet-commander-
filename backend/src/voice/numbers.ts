/**
 * VOICE-001 (PROPOSED): تطبيع النص واستخراج الأرقام من كلام عربي/مصري/إنجليزي.
 * دوال نقية بلا Node APIs ولا حزم — قابلة للنقل إلى الـPWA. لا تعرف مالًا ولا عدادًا.
 */

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_INDIC = '۰۱۲۳۴۵۶۷۸۹';

/** تطبيع للمطابقة فقط: أرقام هندية→غربية، إزالة التشكيل والتطويل، توحيد الألف والياء والتاء المربوطة، أحرف لاتينية صغيرة. */
export function normalize(text: string): string {
  let out = '';
  for (const ch of text) {
    const a = ARABIC_INDIC.indexOf(ch);
    const p = PERSIAN_INDIC.indexOf(ch);
    out += a >= 0 ? String(a) : p >= 0 ? String(p) : ch === '٫' ? '.' : ch === '٬' ? ',' : ch;
  }
  return out
    .normalize('NFKC')
    .replace(/[ً-ٰٟـ]/g, '') // تشكيل وتطويل
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[،؛؟]/g, ' ')
    .replace(/(\d)\s*,(?=\d{3}\b)/g, '$1') // فاصل الآلاف: 1,200 → 1200
    .toLowerCase()
    .replace(/[^\p{L}\p{N}.\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokens(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((t) => t !== '');
}

export function hasArabic(text: string): boolean {
  return /[؀-ۿ]/.test(text);
}

// ───────── كلمات الأرقام (بعد التطبيع) ─────────

const AR_UNITS: Record<string, number> = {
  صفر: 0,
  واحد: 1, واحده: 1,
  اتنين: 2, اثنين: 2, اتنان: 2, اثنان: 2,
  تلاته: 3, ثلاثه: 3, تلات: 3, ثلاث: 3,
  اربعه: 4, اربع: 4,
  خمسه: 5, خمس: 5,
  سته: 6, ست: 6,
  سبعه: 7, سبع: 7,
  تمانيه: 8, ثمانيه: 8, تمان: 8, ثمان: 8,
  تسعه: 9, تسع: 9,
  عشره: 10, عشر: 10,
  حداشر: 11, احداشر: 11,
  اتناشر: 12, اثناشر: 12, اطناشر: 12,
  تلتاشر: 13, تلاتاشر: 13, ثلاثاشر: 13,
  اربعتاشر: 14, اربعطاشر: 14,
  خمستاشر: 15, خمسطاشر: 15,
  ستاشر: 16, سطاشر: 16,
  سبعتاشر: 17, سبعطاشر: 17,
  تمنتاشر: 18, ثمنتاشر: 18, تمانتاشر: 18,
  تسعتاشر: 19, تسعطاشر: 19,
};

const AR_TENS: Record<string, number> = {
  عشرين: 20, عشرون: 20,
  تلاتين: 30, ثلاثين: 30, ثلاثون: 30,
  اربعين: 40, اربعون: 40,
  خمسين: 50, خمسون: 50,
  ستين: 60, ستون: 60,
  سبعين: 70, سبعون: 70,
  تمانين: 80, ثمانين: 80, ثمانون: 80,
  تسعين: 90, تسعون: 90,
};

/** مئات مدمجة (قيمة كاملة). */
const AR_HUNDREDS: Record<string, number> = {
  ميه: 100, مايه: 100, ميت: 100, مئه: 100, مائه: 100,
  ميتين: 200, مئتين: 200, مئتان: 200, ماتين: 200,
  تلتميه: 300, تلاتميه: 300, ثلاثميه: 300, ثلثميه: 300,
  ربعميه: 400, اربعميه: 400, ربعمايه: 400,
  خمسميه: 500, خمسمايه: 500,
  ستميه: 600, سمايه: 600, ستمايه: 600,
  سبعميه: 700, سبعمايه: 700,
  تمنميه: 800, ثمانميه: 800, تمانميه: 800, تمنمايه: 800,
  تسعميه: 900, تسعمايه: 900,
};

const AR_THOUSAND_UNIT = new Set(['الف']);
const AR_THOUSAND_PLURAL = new Set(['الاف', 'تلاف', 'آلاف']);
const AR_TWO_THOUSAND = new Set(['الفين', 'الفان']);
const AR_MIA = new Set(['ميه', 'مايه', 'ميت', 'مئه', 'مائه']);

const EN_UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19,
};
const EN_TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

export interface NumberHit {
  readonly value: number;
  /** فهرس أول وآخر رمز مستهلك (شامل). */
  readonly start: number;
  readonly end: number;
}

const DIGITS = /^\d+(\.\d+)?$/;

/** يزيل بادئة ملتصقة («و» عاطفة أو «ب» الجر أو «ل») من كلمة عربية إن كان الباقي كلمة رقم. */
function stripWaw(tok: string): string {
  if (tok.length > 2 && /^[وبل]/.test(tok) && isArabicNumberWord(tok.slice(1))) return tok.slice(1);
  return tok;
}

function isArabicNumberWord(t: string): boolean {
  return (
    t in AR_UNITS || t in AR_TENS || t in AR_HUNDREDS ||
    AR_THOUSAND_UNIT.has(t) || AR_THOUSAND_PLURAL.has(t) || AR_TWO_THOUSAND.has(t)
  );
}

function isEnglishNumberWord(t: string): boolean {
  return t in EN_UNITS || t in EN_TENS || t === 'hundred' || t === 'thousand';
}

/**
 * يستخرج كل الأرقام من الرموز بالترتيب: أرقام صريحة (85، 85.5) وكلمات (تمانين وخمسة، ميتين وخمسين،
 * eighty five). «ونص» بعد رقم تضيف 0.5. لا تدعم أكثر من 9999 في الكلمات. الأخطاء تفشل بأمان:
 * ما لا يُفهم لا يُستخرج، والمستدعي يسأل من جديد.
 */
export function extractNumbers(toks: readonly string[]): NumberHit[] {
  const hits: NumberHit[] = [];
  let i = 0;
  while (i < toks.length) {
    const t0raw = toks[i] as string;
    const t0 = /^[وب]\d/.test(t0raw) ? t0raw.slice(1) : t0raw; // «و٩٠» و«ب٨٥» ملتصقة
    if (DIGITS.test(t0)) {
      let value = Number(t0);
      let end = i;
      const next = toks[i + 1];
      if (next === 'ونص' || next === 'ونصف') {
        value += 0.5;
        end = i + 1;
      }
      hits.push({ value, start: i, end });
      i = end + 1;
      continue;
    }
    const t = stripWaw(t0);
    if (isArabicNumberWord(t)) {
      const r = parseArabicRun(toks, i);
      hits.push(r);
      i = r.end + 1;
      continue;
    }
    if (isEnglishNumberWord(t0)) {
      const r = parseEnglishRun(toks, i);
      hits.push(r);
      i = r.end + 1;
      continue;
    }
    i++;
  }
  return hits;
}

function parseArabicRun(toks: readonly string[], start: number): NumberHit {
  let total = 0;
  let cur = 0;
  let end = start;
  let i = start;
  let sawAny = false;
  let wawPending = false; // «و» منفصلة سبقت الكلمة
  while (i < toks.length) {
    const raw = toks[i] as string;
    const t = stripWaw(raw);
    const joined = t !== raw && raw.startsWith('و');
    if (raw === 'و' && sawAny) {
      wawPending = true;
      i++;
      continue;
    }
    // وحدتان/عشرتان بلا «و» بينهما ⇒ رقمان لا رقم واحد (ميتين خمسين ≠ 250): لا نخمّن في الأموال.
    if (sawAny && !joined && !wawPending && (t in AR_UNITS || t in AR_TENS)) break;
    if (t in AR_UNITS) {
      cur += AR_UNITS[t] as number;
    } else if (t in AR_TENS) {
      cur += AR_TENS[t] as number;
    } else if (t in AR_HUNDREDS) {
      const unitBefore = cur > 0 && cur < 10 && AR_MIA.has(t);
      cur = unitBefore ? cur * 100 : cur + (AR_HUNDREDS[t] as number);
    } else if (AR_TWO_THOUSAND.has(t)) {
      total += 2000;
    } else if (AR_THOUSAND_UNIT.has(t) || AR_THOUSAND_PLURAL.has(t)) {
      total += (cur === 0 ? 1 : cur) * 1000;
      cur = 0;
    } else {
      break;
    }
    wawPending = false;
    sawAny = true;
    end = i;
    i++;
  }
  let value = total + cur;
  const next = toks[end + 1];
  if (next === 'ونص' || next === 'ونصف') {
    value += 0.5;
    end += 1;
  }
  return { value, start, end };
}

function parseEnglishRun(toks: readonly string[], start: number): NumberHit {
  let total = 0;
  let cur = 0;
  let end = start;
  let i = start;
  while (i < toks.length) {
    const t = toks[i] as string;
    if (t in EN_UNITS) cur += EN_UNITS[t] as number;
    else if (t in EN_TENS) cur += EN_TENS[t] as number;
    else if (t === 'hundred') cur = (cur === 0 ? 1 : cur) * 100;
    else if (t === 'thousand') {
      total += (cur === 0 ? 1 : cur) * 1000;
      cur = 0;
    } else if (t === 'and' && i + 1 < toks.length && isEnglishNumberWord(toks[i + 1] as string)) {
      i++;
      continue;
    } else break;
    end = i;
    i++;
  }
  return { value: total + cur, start, end };
}
