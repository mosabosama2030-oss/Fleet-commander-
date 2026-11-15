# خطة تنفيذ الاختبارات — TEST EXECUTION BLUEPRINT

- **Role**: GROK-2 (Test & Verification Engineer)
- **Issue**: [#7](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/7)
- **Branch**: `agent/GROK-2/FC-006`
- **Base SHA (main)**: `ee2a019c1eb604933d984ff9aee03c4f898fbcd6`
- **Source SHA (session/05-tech-auth-gps)**: `fd0805a579daad06922fe654173bdc30159d6b4f`
- **التاريخ**: 2026-11-15
- **الحالة**: PROPOSED — تصميم اختبارات فقط. **كل الاختبارات NOT_RUN**. لا نتائج وهمية.

---

## 1. الغرض والحدود

هذه الوثيقة تحوّل مصفوفتي `TEST_MATRIX_AR.md` و`TRACEABILITY_MATRIX_AR.md` (من session/05) إلى خطة تنفيذية قابلة للتشغيل لاحقًا.

| القاعدة | التطبيق |
|---|---|
| فصل التصميم عن التنفيذ | لا يُعلن أي اختبار PASSED أو FAILED هنا |
| لا بيانات شخصية حقيقية | Fixtures اصطناعية فقط |
| لا اختبارات مالية رقمية قبل DEC-03 | T-FIN-* تبقى محجوبة |
| لا اختبارات ML قبل ثبوت البيانات والنطاق | T-LEAK / T-REPLAY / توصيات D3 تبقى مؤجلة |
| لا كود منتج في هذا التسليم | وثيقة فقط |

---

## 2. مصادر الحقيقة المستخدمة (VERIFIED)

| المصدر | SHA / موقع | الاستخدام |
|---|---|---|
| `docs/a0/TEST_MATRIX_AR.md` | session/05 @ fd0805a5 | الاختبارات الأساسية (27) |
| `docs/a0/TRACEABILITY_MATRIX_AR.md` | session/05 @ fd0805a5 | ربط FR/NFR + 19 فجوة + اختبارات مقترحة |
| `docs/a0/OPEN_DECISION_REGISTER_AR.md` | session/05 @ fd0805a5 | حالات DEC-01..10 |
| `docs/a0/API_DRAFT.openapi.yaml` | session/05 | مرجع عقدي مستقبلي |
| ARCHITECTURE_CONSISTENCY_REVIEW (GROK-1) | agent/GROK-1/FC-005 | هوية المنتج + SoT hierarchy |

**ملاحظة**: main الحالي لا يحتوي ملفات الاختبار. أي وكيل يقرأ main فقط لن يجد هذه المصفوفات.

---

## 3. ملخص التغطية الحالي

| الفئة | عدد الاختبارات المصممة | حالة التنفيذ | محجوب بقرار |
|---|---|---|---|
| Isolation / Ownership | 4 | NOT_RUN | — |
| Auth | 3 | NOT_RUN | — |
| Idempotency / Network | 2 | NOT_RUN | — |
| Shift lifecycle | 7 | NOT_RUN | — |
| Financial engine | 4 | NOT_RUN | **DEC-03** |
| Attachments / Export | 3 | NOT_RUN | — |
| GPS / Privacy | 6 | NOT_RUN | تفاصيل DEC-10 |
| KPI / Data quality | 2 | NOT_RUN | — |
| AI / Assistant safety | 4 | NOT_RUN | — |
| PWA / RTL / Compat | 4 | NOT_RUN | DEC-08 جزئي |
| **المجموع التقريبي** | **~45** | **كلها NOT_RUN** | — |

---

## 4. مراحل تفعيل الاختبارات (Activation Stages)

| المرحلة | الشرط المسبق | الاختبارات المفعّلة | ملاحظة |
|---|---|---|---|
| **S0 — وثائق فقط** | الآن | لا شيء | الوضع الحالي |
| **S1 — بعد اختيار الـ Stack (DEC-08)** | Backend + DB + Hosting معتمد | T-AUTH-*, T-ISO-*, T-IDEM-01, T-OWN-01, T-LOG-01 | Unit + API contract |
| **S2 — بعد DEC-03 + DEC-05 + DEC-09** | أمثلة شيفت ذهبية + عملة + تصنيفات | T-FIN-01..04, T-EXP-02, T-REV-01, T-SET-01 | Golden financial tests |
| **S3 — بعد تفاصيل DEC-10** | سياسة احتفاظ/عينات GPS | T-GPS-01..05, T-PRIV-01 | Consent + retention |
| **S4 — Web/PWA جاهز** | واجهة قابلة للتشغيل | T-NET-01, T-SOT-01, T-RTL-01, T-GPS-04 | Integration + UI |
| **S5 — Android wrapper** | تغليف موجود | T-WV-01, T-PAR-01, T-COMPAT-01 | Cross-platform |
| **S6 — D2/D3 Intelligence** | بيانات كافية + نطاق خوارزميات معتمد | T-KPI-01, T-DQ-01, T-ETA-01, T-CS-01, T-REC-01, T-LEAK-01, T-REPLAY-01 | لا تبدأ قبل G0/G1 |

---

## 5. الاختبارات الحرجة مرتبة حسب الأولوية

### 5.1 P0 — يجب أن تمر قبل أي بيانات حقيقية أو نشر

| Test ID | يغطي | السيناريو المختصر | معيار PASS | حالة |
|---|---|---|---|---|
| T-ISO-01 | NFR-001, FR-009 | حساب B يقرأ شيفت A | 403/404، لا بيانات | NOT_RUN |
| T-ISO-02 | NFR-001 | B يعدل/يحذف/يصدر سجل A | مرفوض لكل endpoint | NOT_RUN |
| T-OWN-01 | FR-002 | owner_user_id في الجسم يختلف عن الجلسة | يُتجاهل؛ يُستخدم مالك الجلسة | NOT_RUN |
| T-IDEM-01 | NFR-004 | تكرار POST بنفس Idempotency-Key | سجل واحد فقط | NOT_RUN |
| T-AUTH-01 | NFR-006 | تخمين كلمة المرور | rate limit / قفل | NOT_RUN |
| T-AUTH-02 | FR-001, NFR-006 | كلمة المرور مخزنة hash؛ طلب بلا جلسة | hash فقط؛ 401 | NOT_RUN |
| T-GPS-01 | NFR-009, DEC-10 | إرسال نقاط بلا ConsentGrant | 403؛ لا تخزين | NOT_RUN |
| T-LOG-01 | NFR-010 | فحص السجلات | لا كلمات مرور / Tokens | NOT_RUN |

### 5.2 P0 مالي — محجوب صراحة بـ DEC-03

| Test ID | يغطي | الشرط | حالة |
|---|---|---|---|
| T-FIN-01 | FR-008, NFR-005 | شيفت مرجعي 1 بعد اعتماد الأرقام | NOT_RUN — ينتظر DEC-03 |
| T-FIN-02 | FR-008 | شيفت مرجعي 2 | NOT_RUN — ينتظر DEC-03 |
| T-FIN-03 | NFR-005 | خاصية: مجموع المكونات = الإجمالي | NOT_RUN |
| T-FIN-04 | FR-008 | بيانات ناقصة → «إيراد مسجل» لا «صافي» | NOT_RUN |

**قاعدة**: أي PR يضيف منطقًا ماليًا رقميًا قبل إغلاق DEC-03 يجب رفضه.

### 5.3 P1 — دورة الشيفت والتصحيح

| Test ID | يغطي | السيناريو | حالة |
|---|---|---|---|
| T-SH-01 | FR-004/005 | بدء شيفت ثانٍ والأول مفتوح | NOT_RUN |
| T-SH-02 | FR-005 | نهاية < بداية | رفض | NOT_RUN |
| T-SH-03 | UC-02 | إغلاق شيفت مغلق | مرفوض | NOT_RUN |
| T-SH-04 | DEC-04 | شيفت يعبر منتصف الليل | يُنسب ليوم البدء (Cairo) | NOT_RUN |
| T-COR-01 | DEC-06 | تصحيح بلا سبب | 422 | NOT_RUN |
| T-COR-02 | DEC-06 | تصحيح ناجح | Correction + AuditEvent؛ القيمة القديمة محفوظة | NOT_RUN |
| T-COR-03 | DEC-06 | إعادة فتح شيفت مغلق | غير موجودة / 409 | NOT_RUN |
| T-TRIP-01 | FR-006, DEC-02 | رحلة في شيفت CLOSED | 409 | NOT_RUN |
| T-VEH-02 | FR-003, DEC-01 | مركبة ثانية نشطة | 409 | NOT_RUN |

### 5.4 GPS وPrivacy (P1 بعد تفاصيل DEC-10)

| Test ID | يغطي | السيناريو | حالة |
|---|---|---|---|
| T-GPS-02 | DEC-10 | نقاط لشيفت CLOSED | 409 | NOT_RUN |
| T-GPS-03 | DEC-10 | سحب الموافقة ثم إرسال | مرفوضة فورًا | NOT_RUN |
| T-GPS-04 | DEC-10 | مؤشر التتبع في PWA | يظهر؛ لا ادعاء خلفية كاملة | NOT_RUN |
| T-GPS-05 | DEC-10, NFR-001 | قراءة نقاط كابتن آخر | 404 | NOT_RUN |
| T-PRIV-01 | NFR-009 | تصدير / حذف حساب | بيانات المالك فقط + تدقيق | NOT_RUN |

### 5.5 سلامة المساعد (D4)

| Test ID | يغطي | السيناريو | حالة |
|---|---|---|---|
| T-AST-01 | NFR-015/016 | طلب مبلغ أو قبول رحلة من المساعد | رفض | NOT_RUN |
| T-AST-02 | — | Prompt Injection داخل ملف | لا تنفيذ؛ يعامل كبيانات | NOT_RUN |
| T-AST-03 | NFR-013 | كل ادعاء رقمي | له Calculation ID / دليل | NOT_RUN |

---

## 6. متطلبات Fixtures (عند التنفيذ لاحقًا)

| Fixture | الغرض | قيود |
|---|---|---|
| `user_A` / `user_B` | اختبارات العزل | حسابان منفصلان، لا بيانات حقيقية |
| `shift_open_A` | دورة حياة | حالة OPEN |
| `shift_closed_A` | تصحيح / رفض | حالة CLOSED |
| `consent_granted` / `consent_revoked` | GPS | ConsentGrant صريح |
| `golden_shift_1` / `golden_shift_2` | T-FIN-* | **ممنوع إنشاؤها قبل DEC-03** |
| `idempotency_key_reuse` | T-IDEM-01 | نفس المفتاح مرتين |

---

## 7. أوامر مقترحة (عند وجود كود — حاليًا NOT_RUN)

```text
# أمثلة فقط — لا تُشغَّل الآن
# pytest tests/isolation/ -v
# pytest tests/auth/ -v
# pytest tests/finance/ -v   # محجوب حتى DEC-03
# npm run test:api -- --grep isolation
```

لا توجد أوامر فعلية قابلة للتشغيل في المستودع حاليًا (لا كود منتج، لا مجلد tests).

---

## 8. الفجوات المتبقية بعد هذه الخطة

| الفجوة | السبب | الإجراء المطلوب |
|---|---|---|
| أرقام مالية ذهبية | DEC-03 مفتوح | Human Director يوفّر مثالَي شيفت |
| تصنيفات المصروف | DEC-05 مفتوح | قرار Human Director |
| العملة والتقريب | DEC-09 مفتوح | قرار (مقترح: EGP قرش صحيح) |
| مدة احتفاظ GPS | DEC-10 جزئي | قرار سياسة |
| Stack نهائي | DEC-08 جزئي | قرار Backend/DB/Hosting |
| اختبارات متصفح حقيقية | لا واجهة بعد | بعد S4 |

---

## 9. التوصيات لـ MOSAAB

1. إبقاء كل الاختبارات في حالة **NOT_RUN** حتى يتوفر كود قابل للتشغيل.
2. عدم قبول أي PR يدّعي نتائج اختبار مالية قبل إغلاق DEC-03.
3. اعتماد Source-of-Truth hierarchy المقترح من GROK-1 حتى تُدمج الوثائق.
4. بعد اختيار الـ Stack (S1) يبدأ تنفيذ T-ISO / T-AUTH / T-IDEM كأول دفعة.
5. ربط كل اختبار لاحقًا بـ CI check حقيقي (Issue #9 — MANUS-2).

---

## 10. التسليم

- **STATUS**: READY_FOR_REVIEW
- **ROLE**: GROK-2
- **ISSUE**: #7
- **BASE_SHA**: ee2a019c1eb604933d984ff9aee03c4f898fbcd6 (main)
- **SOURCE_SHA**: fd0805a579daad06922fe654173bdc30159d6b4f (session/05)
- **HEAD_SHA**: (بعد هذا الـcommit)
- **CHANGED_PATHS**:
  - `docs/testing/TEST_EXECUTION_BLUEPRINT_AR.md`
- **TEST_COMMANDS**: لا يوجد (وثائقي)
- **ACTUAL_RESULTS**: NOT_REQUIRED — لا اختبارات نُفذت
- **VERIFIED**: المصفوفات الموجودة، حالات DEC، غياب كود المنتج
- **UNKNOWN / BLOCKED**: DEC-03, DEC-05, DEC-09, تفاصيل DEC-10
- **RISKS**: وكلاء يقرؤون main فقط لن يروا مصفوفات الاختبار؛ أي تنفيذ مالي مبكر
- **PR**: سيتم فتحه كـ Draft مرتبط بـ #7
- **NEXT_AGENT_ROLE**: CHATGPT-2 لمراجعة الضمانات الأمنية، ثم MOSAAB

---

*هذه وثيقة تصميم اختبارات فقط. لا نتائج تنفيذ، لا كود منتج، لا دمج. MOSAAB وحده يعتمد.*
