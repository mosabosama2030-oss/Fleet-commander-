# طلب الجلسة 04 (انسخه كما هو في جلسة جديدة)

أنت تعمل على مشروع Fleet Commander (المستودع mosabosama2030-oss/Fleet-commander-). اقرأ أولًا:
`docs/MASTER_ENGINEERING_EXECUTION_PLAN_v1_AR.md` و`docs/sessions/SESSION_03_REPORT_AR.md` و`docs/a0/A0_ACCEPTANCE_REPORT_AR.md` و`docs/a0/OPEN_DECISION_REGISTER_AR.md`، وذاكرة المشروع (fleet-commander).

الفرع: ابدأ من `session/03-a1-nonfinancial` وأنشئ `session/04-...`. PR #1 يبقى OPEN/DRAFT؛ لا دمج ولا إغلاق دون إذن Human Director. لا commit على main.

**إجابات Human Director (املأها قبل النسخ؛ الفارغ يبقى BLOCKED):**
- DEC-01 المركبات: ____
- DEC-02 تسجيل الدخل (إجمالي شيفت / رحلة برحلة): ____
- DEC-03 مثالا شيفت (ساعات، كم، دخل، مصروفات، خصومات، المستلم فعليًا): ____
- DEC-04 الليل (بداية/نهاية، هل تختلف الأسعار): ____
- DEC-06 تعديل الشيفت بعد الإغلاق: ____
- موافقة على DEC-05/07/08/09/10: ____
- الأرشيف المرجعي (ZIP وindex1.html): مرفق / مستبعد
- إجابات Q-A/Q-B/Q-C في docs/a0/USER_JOURNEY_AR.md: ____

الهدف:
1. حوّل المعتمد إلى VERIFIED وحدّث السجل وتقرير القبول.
2. إن وصل مثالا الشيفت: `docs/a0/FINANCIAL_RULES_AR.md` و`docs/a0/golden/*.json` (منزوعة الهوية) وقيم T-FIN-01..04 المتوقعة.
3. حدّث ERD وAPI المالي (`docs/a0/API_DRAFT.openapi.yaml`) وState Machines وData Dictionary حسب القرارات؛ أنهِ A0-03.
4. إن وصل الأرشيف: A0-02 كاملًا (sha256sum، unzip -l، node --check، xmllint).
5. إن وافق المدير على G0: ابدأ A1 المالي ثم اطلب اعتماد G1 قبل أي كود.
6. تحقق من OpenAPI بأداة رسمية إن توفرت (وإلا NOT RUN).

إن لم تتوفر الإجابات: **لا تنتج وثائق جديدة بلا قيمة**. اكتب تقريرًا قصيرًا يقول إن المشروع متوقف على قرارات المدير، ولخّص الأسئلة المطلوبة فقط.

قواعد ثابتة: وسم VERIFIED/INFERRED/PROPOSED/UNKNOWN/NOT RUN؛ لا FIXED_AND_TESTED دون نتيجة اختبار؛ الحساب المالي خارج LLM؛ لا scraping لتطبيقات النقل.

قبل نفاد الجلسة: `docs/sessions/SESSION_04_REPORT_AR.md` ثم `docs/sessions/SESSION_05_PROMPT_AR.md`، وحدّث الذاكرة وملف المشروع.
