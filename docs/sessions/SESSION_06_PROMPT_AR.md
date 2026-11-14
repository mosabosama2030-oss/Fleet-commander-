# طلب الجلسة 06 (انسخه كما هو في جلسة جديدة)

أنت تعمل على Fleet Commander (mosabosama2030-oss/Fleet-commander-). اقرأ: `docs/MASTER_ENGINEERING_EXECUTION_PLAN_v1_AR.md` و`docs/sessions/SESSION_05_REPORT_AR.md` و`docs/a0/A0_ACCEPTANCE_REPORT_AR.md` و`docs/a0/OPEN_DECISION_REGISTER_AR.md`، وذاكرة المشروع.
الفرع: ابدأ من `session/05-tech-auth-gps` وأنشئ `session/06-...`. PR #1 OPEN/DRAFT؛ لا دمج/إغلاق دون إذن. لا commit على main.

**المعتمد (VERIFIED):** مركبة واحدة؛ إيراد رحلة برحلة؛ يوم البدء بتوقيت القاهرة ولا فرق ليل/نهار؛ تصحيح append-only بلا حذف/إعادة فتح؛ بريد+كلمة مرور؛ PWA أولًا وAndroid لاحقًا؛ GPS أثناء الشيفت بموافقة.

**أجوبة المدير (املأها؛ الفارغ BLOCKED):**
- DEC-03 مثال شيفت 1 (ساعات، كم، كل رحلة ومبلغها ومنصتها، مصروفات، خصومات، المستلم فعليًا): ____
- DEC-03 مثال شيفت 2: ____
- DEC-05 تصنيفات المصروفات (وقود، صيانة، غسيل، رسوم طرق، غرامات، أخرى): موافق / تعديل: ____
- DEC-09 EGP بالقرش: موافق / تعديل
- DEC-10: مدة الاحتفاظ بالموقع (أيام): ____ ؛ فترة أخذ العينة: ____ ؛ تقبل أن التتبع في MVP أمامي فقط (PWA)؟ نعم/لا
- DEC-08: الاستضافة وقاعدة البيانات (PostgreSQL مقترحة): ____
- الأرشيف المرجعي: مرفق / مستبعد

الهدف:
1. حدّث السجل وتقرير القبول.
2. إن وصل المثالان: `docs/a0/FINANCIAL_RULES_AR.md` + `docs/a0/golden/*.json` (منزوعة الهوية) وقيم T-FIN-01..04؛ وحسم تكرار Trip.fare_minor/RevenueEntry.
3. حدّث ERD/API المالي/Data Dictionary وأنهِ A0-03 باعتماد الكابتن.
4. الأرشيف إن وصل: A0-02 كاملًا.
5. إن اكتملت P0 ووافق المدير: اطلب اعتماد G0 ثم ابدأ A1 المالي؛ لا كود قبل G1.
إن لم تصل الأجوبة: تقرير قصير + الأسئلة فقط، دون وثائق جديدة بلا قيمة.

قواعد: وسم VERIFIED/INFERRED/PROPOSED/UNKNOWN/NOT RUN؛ لا FIXED_AND_TESTED دون نتيجة اختبار؛ الحساب المالي خارج LLM؛ لا scraping للمنصات.
قبل النفاد: `SESSION_06_REPORT_AR.md` ثم `SESSION_07_PROMPT_AR.md`، وحدّث الذاكرة وملف المشروع.
