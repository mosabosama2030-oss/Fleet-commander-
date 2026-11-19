/**
 * تنقيح PII قبل مغادرة الخادم لأي مزود. قواعد محافظة وقابلة للتوسع.
 * ما ينقّحه: بريد، رقم هاتف، تسلسلات أرقام طويلة (بطاقة/هوية/لوحة طويلة)، إحداثيات GPS.
 * ما لا ينقّحه (INFERRED، حدّ معروف): الأسماء والعناوين النصية الحرة — لا يوجد كاشف موثوق بلا نموذج.
 * لذلك الغرض يحدد ما يُرسل أصلًا (بيانات مجمّعة لا أسماء)؛ التنقيح خط دفاع ثانٍ لا الأول.
 */
const ARABIC_INDIC = /[٠-٩۰-۹]/g;

function toWesternDigits(s: string): string {
  return s.replace(ARABIC_INDIC, (d) => {
    const c = d.charCodeAt(0);
    return String(c >= 0x06f0 ? c - 0x06f0 : c - 0x0660);
  });
}

const RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[EMAIL]'],
  // إحداثيات عشرية زوجية مثل 30.0444, 31.2357
  [/-?\d{1,3}\.\d{3,},\s*-?\d{1,3}\.\d{3,}/g, '[GEO]'],
  // هاتف دولي أو محلي: 11+ رقمًا مع فواصل اختيارية
  [/\+?\d[\d\s-]{9,}\d/g, '[NUMBER]'],
];

export interface Redaction {
  readonly text: string;
  readonly count: number;
}

export function redact(input: string): Redaction {
  let text = toWesternDigits(input);
  let count = 0;
  for (const [re, tag] of RULES) {
    text = text.replace(re, () => {
      count += 1;
      return tag;
    });
  }
  return { text, count };
}
