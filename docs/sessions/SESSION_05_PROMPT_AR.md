# طلب الجلسة 05 (انسخه كما هو في جلسة جديدة)

أنت تعمل على Fleet Commander (mosabosama2030-oss/Fleet-commander-). اقرأ: `docs/MASTER_ENGINEERING_EXECUTION_PLAN_v1_AR.md` و`docs/sessions/SESSION_04_REPORT_AR.md` و`docs/a0/A0_ACCEPTANCE_REPORT_AR.md` و`docs/a0/OPEN_DECISION_REGISTER_AR.md`، وذاكرة المشروع.
الفرع: ابدأ من `session/04-decisions-applied` وأنشئ `session/05-...`. PR #1 OPEN/DRAFT؛ لا دمج/إغلاق دون إذن. لا commit على main.

**المعتمد (VERIFIED):** مركبة واحدة؛ إيراد رحلة برحلة؛ يوم البدء بتوقيت القاهرة؛ تصحيح append-only بلا حذف/إعادة فتح.

**أجوبة المدير (املأها؛ الفارغ BLOCKED):**
- DEC-03 مثال شيفت 1 (ساعات، كم، رحلات ومبالغها، مصروفات، خصومات، المستلم فعليًا): ____
- DEC-03 مثال شيفت 2 (ليلي/مختلط): ____
- هل تختلف أسعار الليل؟ يبدأ/ينتهي: ____
- موافقة على DEC-05/07/08/09/10 والمنصات (uber,didi,careem,indrive,other) وفصل Correction: ____
- الأرشيف المرجعي: مرفق / مستبعد

الهدف:
1. حدّث السجل وتقرير القبول بالجديد.
2. إن وصل المثالان: `docs/a0/FINANCIAL_RULES_AR.md` + `docs/a0/golden/*.json` (منزوعة الهوية) وقيم T-FIN-01..04؛ وحسم تكرار Trip.fare_minor/RevenueEntry.
3. حدّث ERD/API المالي/Data Dictionary وأنهِ A0-03.
4. الأرشيف إن وصل: A0-02 كاملًا.
5. إن وافق المدير على G0: A1 المالي، ثم اطلب اعتماد G1 قبل أي كود.
إن لم تصل الأجوبة: لا تنتج وثائق جديدة بلا قيمة؛ تقرير قصير + الأسئلة فقط.

قواعد: وسم VERIFIED/INFERRED/PROPOSED/UNKNOWN/NOT RUN؛ لا FIXED_AND_TESTED دون نتيجة اختبار؛ الحساب المالي خارج LLM؛ لا scraping للمنصات.
قبل النفاد: `SESSION_05_REPORT_AR.md` ثم `SESSION_06_PROMPT_AR.md`، وحدّث الذاكرة وملف المشروع.
