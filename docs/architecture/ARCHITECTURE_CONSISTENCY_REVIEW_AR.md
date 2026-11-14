# مراجعة اتساق المعمارية — GROK-1 / FC-005

- **Role**: GROK-1 (Chief Architect)
- **Issue**: [#6](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/6)
- **Branch**: `agent/GROK-1/FC-005`
- **Base SHA (session/05-tech-auth-gps)**: `fd0805a579daad06922fe654173bdc30159d6b4f`
- **Base SHA (main)**: `6cebb40136f11027ec7e5e3c50f62a813a03938f`
- **Base SHA (PR #1 head)**: `a727c8a591a312b0e856d297e7c1bc50fa5b140a`
- **Base SHA (chore/multi-agent-operating-system)**: `08f442e4ba399970712c155eca0c18bf90e883f5`
- **التاريخ**: 2026-11-14
- **الحالة**: PROPOSED — بانتظار مراجعة Human Director (MOSAAB)

---

## 1. ملخص تنفيذي

| الموضوع | الخلاصة | التصنيف |
|---|---|---|
| هوية المنتج | كابتن فردي + مساعد تشغيل وذكاء شخصي. **ليس** marketplace أو fleet dispatch أو مطابقة سائق/راكب | VERIFIED |
| مصدر الحقيقة الحالي | `session/05-tech-auth-gps` هو الأغنى والأحدث (قرارات Human Director + ERD + API drafts + ADRs). `main` شبه فارغ | VERIFIED |
| Modular Monolith | مبدأ معتمد في الخطة وADR-001 (PROPOSED) | PROPOSED |
| Web/PWA-first + Android لاحقًا كتغليف | DEC-08 جزئي VERIFIED + ADR-009 | VERIFIED (جزئي) |
| API واحدة | مبدأ ثابت (ADR-003 PROPOSED) | PROPOSED |
| Online-only | A0-DEC-003 VERIFIED | VERIFIED |
| GPS consent | DEC-10 جزئي VERIFIED + ADR-008 (PWA foreground فقط) | VERIFIED (جزئي) |
| المحرك المالي الحتمي | خارج LLM (ADR-007 + NFR-015) | PROPOSED (مبدأ) / BLOCKED (قواعد DEC-03) |
| تعارضات حرجة تمنع التنفيذ | DEC-03 (أمثلة شيفت) لا يزال BLOCKED | VERIFIED |

**التوصية الرئيسية**: اعتماد `session/05-tech-auth-gps` كمصدر حقيقة مؤقت للوثائق حتى يُراجع PR #1 وPR #12 ويُدمجا (أو يُرفضان) بقرار MOSAAB. لا يبدأ كود منتج مالي قبل إغلاق DEC-03.

---

## 2. خريطة الفروع والمصادر (VERIFIED)

| الفرع / المرجع | SHA | المحتوى الرئيسي | علاقة بـmain |
|---|---|---|---|
| `main` | `6cebb401...` | `ENGINEERING_EXECUTION_PLAN_AR.md` فقط (نسخة أقدم) | الأساس |
| `docs/a0-captain-requirements` (PR #1) | `a727c8a5...` | A0_REQUIREMENTS + خطة + أبحاث خوارزميات + FULL_PROJECT_EXECUTION_PLAN | OPEN/DRAFT |
| `session/05-tech-auth-gps` | `fd0805a5...` | كل ما في PR #1 + docs/a0/* + docs/a1/* + sessions reports + قرارات Human Director المحدثة | 23+ commit ahead (وقت الفحص) |
| `chore/multi-agent-operating-system` (PR #12) | `08f442e4...` | AGENTS.md + تعليمات الوكلاء + فهرس المهام | OPEN/DRAFT |
| `session/01` … `session/04` | متعددة | مراحل سابقة | تاريخية |

**ملاحظة**: لا توجد حماية على أي فرع (`protected=false`). لا Rulesets.

---

## 3. هوية المنتج — هل هو Captain Intelligence أم Marketplace؟

### الأدلة (VERIFIED من الملفات)

من `A0_REQUIREMENTS_AR.md` (session/05):
- A0-DEC-001: المستخدم = كابتن فردي فقط.
- خارج النطاق صراحة: إدارة الأساطيل، تعدد الكباتن، أدوار مدير/مشرف، لوحات أداء أسطول، مطابقة سائق/راكب، قبول رحلات آلي.
- الهدف: تسجيل شيفتات/رحلات/مصروفات + احتساب حتمي + تقارير + مساعد ذكاء داعم للقرار (D3) بدون تنفيذ ذاتي.

من `OBJECTIVE_AND_SAFETY_AR.md`:
- تعظيم العائد المعروف لكل ساعة اتصال ضمن قيود سلامة يحددها الكابتن.
- Human-in-the-loop إلزامي.

من `CAPTAIN_INTELLIGENCE_ALGORITHMS_AR.md` وبحث Uber/DiDi:
- خوارزميات موجهة للكابتن الشخصي (توقع، توصية منطقة/وقت، كشف شذوذ بيانات شخصية).
- لا يوجد تصميم لـdispatch أو matching marketplace.

**الخلاصة**: المنتج = **Captain Intelligence / Personal Ops Assistant**. اسم «Fleet Commander» تاريخي ولا يعكس نطاق الإصدار الأول. أي وثيقة أو كود يفترض إدارة أسطول أو marketplace يجب رفضه.

---

## 4. مبادئ المعمارية — الحالة الحالية

| المبدأ | المصدر | الحالة | ملاحظات |
|---|---|---|---|
| Modular Monolith | ENGINEERING_EXECUTION_PLAN §4 + ADR-001 | PROPOSED | مناسب لفريق صغير؛ لا microservices مبكرًا |
| API واحدة لـWeb وAndroid | ADR-003 + FR-015 | PROPOSED | عقد OpenAPI مشترك |
| Online-only | A0-DEC-003 | VERIFIED | لا offline queue |
| الحساب المالي حتمي خارج LLM | ADR-007 + NFR-015 | PROPOSED (مبدأ) | BLOCKED حتى DEC-03 |
| PWA-first + Android wrapper لاحقًا | DEC-08 + ADR-009 | VERIFIED جزئيًا | قيد GPS خلفية معروف |
| GPS بموافقة صريحة أثناء الشيفت | DEC-10 + ADR-008 | VERIFIED جزئيًا | PWA = foreground فقط (INFERRED منصة) |
| بريد + كلمة مرور | DEC-07 + ADR-010 | VERIFIED | |
| تصحيح append-only | DEC-06 + ADR-005 | VERIFIED | |
| مركبة واحدة | DEC-01 | VERIFIED | |
| إدخال رحلة برحلة يدوي | DEC-02 | VERIFIED | |
| لا فرق ليل/نهار في الأجر | DEC-04 | VERIFIED | |

---

## 5. التعارضات الموثقة

### 5.1 تعارض مصادر الحقيقة (P0)

| الموضوع | main | PR #1 | session/05 | التوصية |
|---|---|---|---|---|
| ENGINEERING_EXECUTION_PLAN | SHA قديم | نسخة أحدث | نسخة أحدث + تحديثات | اعتماد session/05 مؤقتًا |
| قرارات Human Director | غير موجودة | جزئية | كاملة حتى 2026-11-14 | session/05 |
| OPEN_DECISION_REGISTER | غير موجود | موجود | محدث بـVERIFIED | session/05 |
| ADRs | غير موجودة | غير موجودة | ADR-001..010 | session/05 |
| API drafts / ERD / UX | غير موجودة | محدودة | موجودة | session/05 |

**خطر**: أي وكيل يقرأ `main` فقط سيفتقد كل القرارات المغلقة والتقنية.

### 5.2 تعارضات محتوى محددة

1. **عدد المركبات**: في وثائق قديمة كان UNKNOWN؛ الآن DEC-01 = مركبة واحدة (VERIFIED). ERD في session/05 يفترض قيد «مركبة نشطة واحدة».
2. **GPS**: الافتراض القديم «بلا GPS مستمر» خُولف بقرار Human Director (GPS أثناء الشيفت بموافقة). ADR-008 يوثق القيد التقني لـPWA.
3. **المعادلات المالية المرجعية** (من msb-2026-0002): `max(ساعات×سعر، كم×سعر)` لليل والنهار — **غير معتمدة**. DEC-03 ما زال BLOCKED بانتظار أمثلة حقيقية.
4. **لغة/إطار Backend وDB والاستضافة**: لا تزال PROPOSED/UNKNOWN (TECH_OPTIONS_AR.md). لا اختيار نهائي.

### 5.3 تعقيد غير ضروري مرصود

- وجود بحث طويل عن خوارزميات Uber/DiDi (68KB) مفيد كمرجع مستقبلي (D3) لكنه ليس مطلوبًا لـA0/A1/D1. لا يجب أن يؤخر النواة.
- تعدد نسخ ENGINEERING_EXECUTION_PLAN وMASTER_ENGINEERING_EXECUTION_PLAN يزيد خطر القراءة من مصدر خاطئ.
- FULL_PROJECT_EXECUTION_PLAN_AR.md (77KB) داخل docs/a0-captain-requirements يبدو شاملًا لكنه غير مدمج؛ يحتاج مقارنة لاحقة مع الخطة الرئيسية.

---

## 6. ADRs المقترحة / المطلوب تعزيزها

| ADR | الحالة الحالية | توصية GROK-1 |
|---|---|---|
| ADR-001 Modular Monolith | PROPOSED | الإبقاء؛ مناسب |
| ADR-002 PostgreSQL | PROPOSED | الإبقاء كافتراض؛ يحتاج قرار DEC-08 |
| ADR-003 Single OpenAPI | PROPOSED | الإبقاء |
| ADR-004 Integer cents | PROPOSED | يعتمد على DEC-09 |
| ADR-005 Append-only | مدعوم بـDEC-06 VERIFIED | يمكن ترقيته بعد مراجعة |
| ADR-006 Idempotency-Key | PROPOSED | إلزامي للكتابات المالية |
| ADR-007 Deterministic finance | PROPOSED | مبدأ ثابت |
| ADR-008 GPS consent + PWA limit | مرتبط بـDEC-10 | جيد؛ يحتاج تفاصيل احتفاظ/عينات |
| ADR-009 PWA-first | مرتبط بـDEC-08 | جيد |
| ADR-010 Auth email/password | مرتبط بـDEC-07 | جيد |

**ADR جديد مقترح (PROPOSED)**:
- **ADR-011 — Source of Truth Hierarchy**: ترتيب قراءة الوثائق حتى دمج الفروع:
  1. قرارات Human Director المسجلة في OPEN_DECISION_REGISTER (session/05)
  2. session/05-tech-auth-gps
  3. PR #1 / docs/a0-captain-requirements
  4. main
  5. المراجع الخارجية (msb-*, Commander-os.1) — قراءة فقط

---

## 7. المخاطر المعمارية

| المخاطر | الشدة | الدليل | التخفيف المقترح |
|---|---|---|---|
| قراءة وكيل من main فقط | عالية | main فارغ تقريبًا | توثيق Source-of-Truth + CLAIM يذكر SHA |
| بدء كود مالي قبل DEC-03 | عالية | BLOCKED صريح | بوابة G0 + رفض PRs مالية |
| افتراض GPS خلفية على PWA | متوسطة | ADR-008 + SESSION_05_REPORT | عرض تنبيه UI؛ لا تدّعِ |
| عدم حماية main | عالية | protected=false | Issue #11 (Human) |
| تكرار وثائق خطط التنفيذ | متوسطة | نسخ متعددة | توحيد بعد اعتماد MOSAAB |
| اعتماد معادلات المرجع القديم | عالية | max() ليل/نهار غير معتمد | انتظار أمثلة DEC-03 |

---

## 8. التوصيات قبل التنفيذ (للـMOSAAB)

1. **اعتماد Source-of-Truth مؤقت**: session/05-tech-auth-gps حتى مراجعة ودمج/رفض PR #1 وPR #12.
2. **إغلاق DEC-03**: توفير مثالي شيفت منزوعي الهوية (ساعات، كم، دخل، مصروفات، مستلم فعلي).
3. **إغلاق DEC-05 وDEC-09**: تصنيفات مصروفات + عملة/تقريب.
4. **تفاصيل DEC-08 وDEC-10**: إطار Backend + DB + استضافة؛ مدة احتفاظ GPS + فترة عينات.
5. **تفعيل حماية main** (Issue #11).
6. **لا كود منتج** يعتمد على قرارات P0 مفتوحة.
7. **الإبقاء على Modular Monolith + Single API + Online-only + Deterministic finance** كمبادئ ثابتة.

---

## 9. ما لم يُنجز في هذه المراجعة

- مقارنة سطرية كاملة لـFULL_PROJECT_EXECUTION_PLAN_AR.md مقابل الخطة الرئيسية (حجم كبير).
- تدقيق تفصيلي لكل ملف في docs/a0 وdocs/a1 (تم أخذ عينات كافية للاتساق).
- إنشاء ملفات ADR فردية جديدة (اكتفيت بالفهرس + اقتراح ADR-011).
- أي كود أو اختبارات (NOT_REQUIRED في هذه المرحلة).

---

## 10. التسليم

- **STATUS**: READY_FOR_REVIEW
- **ROLE**: GROK-1
- **ISSUE**: #6
- **BASE_SHA**: fd0805a579daad06922fe654173bdc30159d6b4f (session/05)
- **HEAD_SHA**: (بعد هذا الـcommit)
- **CHANGED_PATHS**: docs/architecture/ARCHITECTURE_CONSISTENCY_REVIEW_AR.md
- **TEST_COMMANDS**: لا يوجد (وثائقي)
- **ACTUAL_RESULTS**: NOT_REQUIRED
- **VERIFIED / UNKNOWN**: كما في الجداول أعلاه
- **RISKS**: انظر القسم 7
- **PR**: سيتم فتحه كـDraft مرتبط بـIssue #6
- **NEXT_AGENT_ROLE**: CHATGPT-1 (تحديث مصدر الحقيقة بعد اعتماد MOSAAB) أو MOSAAB مباشرة للقرارات

---

*هذه المراجعة تحليلية فقط. لا دمج ولا نشر ولا تغيير قرارات منتج. MOSAAB وحده يعتمد.*
