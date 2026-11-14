# طلب الجلسة 03 (انسخه كما هو في جلسة جديدة)

أنت تعمل على مشروع Fleet Commander (المستودع mosabosama2030-oss/Fleet-commander-). اقرأ أولًا:
`docs/MASTER_ENGINEERING_EXECUTION_PLAN_v1_AR.md` و`docs/sessions/SESSION_02_REPORT_AR.md` و`docs/a0/A0_ACCEPTANCE_REPORT_AR.md` و`docs/a0/OPEN_DECISION_REGISTER_AR.md`، وذاكرة المشروع (fleet-commander).

الفرع: ابدأ من `session/02-a0-closure-a1-prep` وأنشئ `session/03-...`. PR #1 يبقى OPEN/DRAFT؛ لا دمج ولا إغلاق دون إذن Human Director. لا commit مباشر على main.

**إجابات Human Director (املأها قبل النسخ؛ ما يُترك فارغًا يبقى BLOCKED):**
- DEC-01 المركبات: ____
- DEC-02 تسجيل الدخل: ____
- DEC-03 مثالا شيفت (الساعات، الكم، الدخل، المصروفات، الخصومات، المستلم): ____
- DEC-04 الليل (يبدأ/ينتهي، هل تختلف الأسعار): ____
- DEC-06 تعديل الشيفت بعد الإغلاق: ____
- موافقة على الافتراضات المقترحة DEC-05/07/08/09/10: ____
- الأرشيف المرجعي (ZIP وindex1.html): مرفق / مستبعد
- إجابات Q-A/Q-B/Q-C (USER_JOURNEY_AR.md): ____

هدف الجلسة 03:
1. حوّل المعتمد في السجل إلى VERIFIED وحدّث `A0_ACCEPTANCE_REPORT_AR.md`.
2. إن وصل مثالا الشيفت: اكتب `docs/a0/FINANCIAL_RULES_AR.md` (معادلات وأمثلة حدودية) و`docs/a0/golden/*.json` منزوعة الهوية، وحدّث T-FIN-01..04 بقيم متوقعة (ما زالت NOT RUN).
3. حدّث ERD وAPI وState Machines وData Dictionary حسب القرارات؛ أنهِ A0-03 باعتماد الكابتن للمسار.
4. إن وصل الأرشيف: نفّذ A0-02 كاملًا (sha256sum، unzip -l، node --check، xmllint) وسجّل النتائج.
5. إن اكتملت P0 ووافق المدير على G0: ابدأ A1 الرسمي (OpenAPI كامل، UX flows، Security Design، عقود Recommendation/Assistant)، وليس كود المنتج قبل G1.

إن لم تتوفر الإجابات: لا تخمّن؛ أنجز ما لا يعتمد على المال (عقد OpenAPI التفصيلي للمصادقة والمركبات والمرفقات، Security Design، UX flows)، وسجّل الباقي BLOCKED.

قواعد ثابتة: وسم كل ادعاء VERIFIED/INFERRED/PROPOSED/UNKNOWN/NOT RUN؛ لا FIXED_AND_TESTED دون نتيجة اختبار؛ الحساب المالي خارج LLM؛ لا scraping لتطبيقات النقل.

قبل نفاد الجلسة: اكتب `docs/sessions/SESSION_03_REPORT_AR.md` (ما تم/ما لم يتم/الأدلة) ثم `docs/sessions/SESSION_04_PROMPT_AR.md`، وحدّث ذاكرة المشروع وملف المشروع.
