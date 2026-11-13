# طلب الجلسة 02 (انسخه كما هو في جلسة جديدة)

أنت تعمل على مشروع Fleet Commander (المستودع mosabosama2030-oss/Fleet-commander-). اقرأ أولًا:
`docs/MASTER_ENGINEERING_EXECUTION_PLAN_v1_AR.md` و`docs/sessions/SESSION_01_REPORT_AR.md` و`docs/a0/OPEN_DECISION_REGISTER_AR.md`، وذاكرة المشروع (fleet-commander).

الفرع: ابدأ من `session/01-a0-deliverables` وأنشئ `session/02-...`. PR #1 يبقى OPEN/DRAFT؛ لا دمج ولا إغلاق دون إذن Human Director. لا commit مباشر على main.

هدف الجلسة 02 — إغلاق ما تسمح به قرارات المدير في A0:
1. حدّث `OPEN_DECISION_REGISTER_AR.md` بإجابات Human Director (الأسئلة الخمسة + أي تعديل على الافتراضات) وحوّل المعتمد إلى VERIFIED.
2. إن وصل مثالا الشيفت: اكتب `docs/a0/FINANCIAL_RULES_AR.md` بمعادلات ونصوص وأمثلة حدودية، و`docs/a0/golden/` بيانات مرجعية JSON (منزوعة الهوية) للمحرك المالي.
3. أنهِ A0-03 (دورة عمل الكابتن) وUC المنقّحة، وحدّث ERD وAPI حسب القرارات.
4. نفّذ A0-02: أعد التحقق من أرشيف المراجع (SHA-256، قائمة الملفات، فحص JS/XML) وسجّل ما يتعذر كـ NOT RUN.
5. أعد مراجعة مصفوفة التتبع FR/NFR → اختبارات، وأنتج `A0_ACCEPTANCE_REPORT_AR.md` يبيّن كل P0 مغلق/مفتوح.
6. إن اكتملت P0 وطلب المدير الانتقال: ابدأ A1 (State Machines، Data Dictionary، ADRs) — وليس كود المنتج قبل G0/G1.

إن لم تتوفر إجابات المدير: لا تخمّن قواعد مالية؛ اعمل على A0-02 والتتبع ومواد A1 غير المعتمدة على المال، وسجّل الباقي BLOCKED.

قواعد ثابتة: وسم كل ادعاء VERIFIED/INFERRED/PROPOSED/UNKNOWN/NOT RUN؛ لا FIXED_AND_TESTED دون نتيجة اختبار؛ الحساب المالي خارج LLM؛ لا scraping لتطبيقات النقل.

قبل نفاد الجلسة: اكتب `docs/sessions/SESSION_02_REPORT_AR.md` (ما تم/ما لم يتم/الأدلة) ثم `docs/sessions/SESSION_03_PROMPT_AR.md`، وحدّث ذاكرة المشروع.
