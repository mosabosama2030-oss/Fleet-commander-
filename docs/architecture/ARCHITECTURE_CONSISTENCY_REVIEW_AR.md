# مراجعة اتساق المعمارية — GROK-1 / FC-005

- **Role**: GROK-1 (Chief Architect)
- **Issue**: [#6](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/6)
- **Branch**: `agent/GROK-1/FC-005-refresh`
- **Base SHA (main at execution)**: `ee2a019c1eb604933d984ff9aee03c4f898fbcd6`
- **Reference SHA (session/05-tech-auth-gps)**: `fd0805a579daad06922fe654173bdc30159d6b4f`
- **Reference SHA (PR #1 head)**: `a727c8a591a312b0e856d297e7c1bc50fa5b140a`
- **التاريخ**: 2026-11-15
- **الحالة**: READY_FOR_REVIEW — بانتظار مراجعة Human Director (MOSAAB)

---

## 1. ملخص تنفيذي

| الموضوع | الخلاصة | التصنيف |
|---|---|---|
| هوية المنتج | كابتن فردي + مساعد تشغيل وذكاء شخصي. **ليس** marketplace أو fleet dispatch أو مطابقة سائق/راكب | VERIFIED |
| مصدر الحقيقة الحالي | `main` يحتوي الآن تعليمات الوكلاء (بعد دمج PR #12). الوثائق التفصيلية لـA0/A1 لا تزال على `session/05-tech-auth-gps` وPR #1 | VERIFIED |
| Modular Monolith | مبدأ معتمد في الخطة وADR-001 (PROPOSED) | PROPOSED |
| Web/PWA-first + Android لاحقًا كتغليف | DEC-08 جزئي VERIFIED + ADR-009 | VERIFIED (جزئي) |
| API واحدة | مبدأ ثابت (ADR-003 PROPOSED) | PROPOSED |
| Online-only | A0-DEC-003 VERIFIED | VERIFIED |
| GPS consent | DEC-10 جزئي VERIFIED + ADR-008 (PWA foreground فقط) | VERIFIED (جزئي) |
| المحرك المالي الحتمي | خارج LLM (ADR-007 + NFR-015) | PROPOSED (مبدأ) / BLOCKED (قواعد DEC-03) |
| تعارضات حرجة تمنع التنفيذ | DEC-03 (أمثلة شيفت) لا يزال BLOCKED | VERIFIED |
| حماية main | `protected=true` (تم التفعيل) | VERIFIED |

**التوصية الرئيسية**:
1. الإبقاء على `session/05-tech-auth-gps` كمصدر حقيقة للوثائق التفصيلية حتى يُراجع PR #1 ويُدمج أو يُرفض.
2. لا يبدأ كود منتج مالي قبل إغلاق DEC-03.
3. المبادئ المعمارية الأساسية (Modular Monolith، Single API، Online-only، Deterministic finance) جاهزة للاعتماد.

---

## 2. خريطة الفروع والمصادر (VERIFIED — فحص 2026-11-15)

| الفرع / المرجع | SHA | المحتوى الرئيسي | علاقة بـmain |
|---|---|---|---|
| `main` | `ee2a019c...` | AGENTS.md + docs/agents/* + ENGINEERING_EXECUTION_PLAN + قوالب GitHub | الأساس المحمي |
| `docs/a0-captain-requirements` (PR #1) | `a727c8a5...` | A0_REQUIREMENTS + خطط + أبحاث خوارزميات | OPEN |
| `session/05-tech-auth-gps` | `fd0805a5...` | docs/a0/* + docs/a1/* + sessions + قرارات Human Director | غير مدمج |
| فروع الوكلاء الأخرى | متعددة | أعمال متوازية (CLAUDE, MANUS, GROK-2) | OPEN PRs |

**ملاحظة**: `main` أصبح محميًا (`protected=true`). لا يوجد Rulesets إضافية مرصودة في هذا الفحص.

---

## 3. هوية المنتج — هل هو Captain Intelligence أم Marketplace؟

### الأدلة (VERIFIED)

من `A0_REQUIREMENTS_AR.md` (session/05):
- A0-DEC-001: المستخدم = كابتن فردي فقط.
- خارج النطاق صراحة: إدارة الأساطيل، تعدد الكباتن، أدوار مدير/مشرف، لوحات أداء أسطول، مطابقة سائق/راكب، قبول رحلات آلي.
- الهدف: تسجيل شيفتات/رحلات/مصروفات + احتساب حتمي + تقارير + مساعد ذكاء داعم للقرار (D3) بدون تنفيذ ذاتي.

من `OBJECTIVE_AND_SAFETY_AR.md`:
- تعظيم العائد المعروف لكل ساعة اتصال ضمن قيود سلامة يحددها الكابتن.
- Human-in-the-loop إلزامي.

**الخلاصة**: المنتج = **Captain Intelligence / Personal Ops Assistant**. اسم «Fleet Commander» تاريخي ولا يعكس نطاق الإصدار الأول. أي وثيقة أو كود يفترض إدارة أسطول أو marketplace يجب رفضه.

---

## 4. مبادئ المعمارية — الحالة الحالية

| المبدأ | المصدر | الحالة | ملاحظات |
|---|---|---|---|
| Modular Monolith | ENGINEERING_EXECUTION_PLAN §4 + ADR-001 | PROPOSED | مناسب لفريق صغير |
| API واحدة لـWeb وAndroid | ADR-003 + FR-015 | PROPOSED | عقد OpenAPI مشترك |
| Online-only | A0-DEC-003 | VERIFIED | لا offline queue |
| الحساب المالي حتمي خارج LLM | ADR-007 + NFR-015 | PROPOSED (مبدأ) | BLOCKED حتى DEC-03 |
| PWA-first + Android wrapper لاحقًا | DEC-08 + ADR-009 | VERIFIED جزئيًا | قيد GPS خلفية معروف |
| GPS بموافقة صريحة أثناء الشيفت | DEC-10 + ADR-008 | VERIFIED جزئيًا | PWA = foreground فقط |
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
| تعليمات الوكلاء | موجودة (بعد دمج PR #12) | غير موجودة | غير موجودة | main |
| قرارات Human Director التفصيلية | غير موجودة | جزئية | كاملة | session/05 |
| OPEN_DECISION_REGISTER / ADRs / ERD / API drafts | غير موجودة | محدودة | موجودة | session/05 |
| ENGINEERING_EXECUTION_PLAN | موجودة (نسخة أساسية) | نسخة أحدث | نسخة أحدث | تحتاج توحيدًا |

**خطر**: أي وكيل يقرأ `main` فقط سيفتقد القرارات المغلقة في session/05 وPR #1.

### 5.2 تعارضات محتوى محددة

1. **عدد المركبات**: DEC-01 = مركبة واحدة (VERIFIED).
2. **GPS**: قرار Human Director = أثناء الشيفت بموافقة. قيد PWA foreground موثق في ADR-008.
3. **المعادلات المالية المرجعية** من msb-2026-0002: غير معتمدة. DEC-03 BLOCKED.
4. **Backend / DB / Hosting**: لا تزال PROPOSED/UNKNOWN.

### 5.3 تعقيد غير ضروري

- بحث Uber/DiDi طويل مفيد لـD3 فقط؛ لا يؤخر النواة.
- تعدد نسخ خطط التنفيذ يزيد خطر القراءة من مصدر خاطئ.

---

## 6. ADRs المقترحة

| ADR | الحالة | توصية GROK-1 |
|---|---|---|
| ADR-001 Modular Monolith | PROPOSED | الإبقاء |
| ADR-002 PostgreSQL | PROPOSED | يحتاج قرار DEC-08 |
| ADR-003 Single OpenAPI | PROPOSED | الإبقاء |
| ADR-004 Integer cents | PROPOSED | يعتمد على DEC-09 |
| ADR-005 Append-only | مدعوم بـDEC-06 | يمكن ترقيته |
| ADR-006 Idempotency-Key | PROPOSED | إلزامي للكتابات المالية |
| ADR-007 Deterministic finance | PROPOSED | مبدأ ثابت |
| ADR-008 GPS consent + PWA limit | مرتبط بـDEC-10 | جيد |
| ADR-009 PWA-first | مرتبط بـDEC-08 | جيد |
| ADR-010 Auth email/password | مرتبط بـDEC-07 | جيد |

**ADR-011 مقترح (PROPOSED) — Source of Truth Hierarchy**:
1. قرارات Human Director في OPEN_DECISION_REGISTER (session/05)
2. session/05-tech-auth-gps
3. PR #1
4. main
5. المراجع الخارجية — قراءة فقط

---

## 7. المخاطر المعمارية

| المخاطر | الشدة | التخفيف |
|---|---|---|
| قراءة وكيل من main فقط | عالية | توثيق SoT + CLAIM يذكر SHA |
| بدء كود مالي قبل DEC-03 | عالية | بوابة G0 |
| افتراض GPS خلفية على PWA | متوسطة | تنبيه UI |
| تكرار وثائق الخطط | متوسطة | توحيد بعد اعتماد MOSAAB |
| اعتماد معادلات المرجع القديم | عالية | انتظار DEC-03 |

---

## 8. التوصيات قبل التنفيذ (للـMOSAAB)

1. اعتماد Source-of-Truth المؤقت: session/05 للوثائق التفصيلية.
2. إغلاق DEC-03 (مثالا شيفت).
3. إغلاق DEC-05 وDEC-09.
4. تفاصيل DEC-08 وDEC-10.
5. الإبقاء على المبادئ الثابتة: Modular Monolith + Single API + Online-only + Deterministic finance.
6. لا كود منتج يعتمد على قرارات P0 مفتوحة.

---

## 9. ما لم يُنجز

- مقارنة سطرية كاملة لـFULL_PROJECT_EXECUTION_PLAN_AR.md.
- إنشاء ملفات ADR فردية جديدة.
- أي كود أو اختبارات تشغيلية (NOT_REQUIRED — المهمة وثائقية).

---

## 10. التسليم

- **STATUS**: READY_FOR_REVIEW
- **ROLE**: GROK-1
- **ISSUE**: #6
- **BASE_SHA**: ee2a019c1eb604933d984ff9aee03c4f898fbcd6 (main)
- **CHANGED_PATHS**: docs/architecture/ARCHITECTURE_CONSISTENCY_REVIEW_AR.md
- **TEST_COMMANDS**: لا يوجد (وثائقي)
- **ACTUAL_RESULTS**: NOT_REQUIRED
- **RISKS**: انظر القسم 7
- **NEXT_AGENT_ROLE**: MOSAAB (اعتماد) ثم CHATGPT-1 لتحديث مصدر الحقيقة

---

*مراجعة تحليلية فقط. لا دمج ولا نشر ولا تغيير قرارات منتج. MOSAAB وحده يعتمد.*
