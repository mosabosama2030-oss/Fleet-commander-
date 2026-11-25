# خطة تنفيذ الاختبارات — TEST EXECUTION BLUEPRINT

- **Role**: GROK-2 (Test & Verification Engineer)
- **Issue**: [#7](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/7)
- **Branch**: `agent/GROK-2/FC-006`
- **Base SHA (main)**: `8ba4511629cb6f64e21ce9a7537c034cf77a9660`
- **Previous Blueprint SHA**: `cf101bb3ee7826787d405e97557d473d0fa4ec15`
- **التاريخ**: 2026-11-25
- **الحالة**: PROPOSED / READY_FOR_REVIEW — تصميم اختبارات فقط. **كل الاختبارات NOT_RUN**. لا نتائج وهمية. لا كود منتج.

---

## 1. الغرض والحدود

هذه الوثيقة تحوّل مصفوفات الاختبار ومتطلبات الأمن إلى خطة تنفيذية قابلة للتشغيل لاحقًا، وتربطها بأدلة GitHub الحية.

| القاعدة | التطبيق |
|---|---|
| فصل التصميم عن التنفيذ | لا يُعلن أي اختبار PASSED أو FAILED هنا |
| لا بيانات شخصية حقيقية | Fixtures اصطناعية فقط |
| لا اختبارات مالية رقمية قبل DEC-03 | T-FIN-* تبقى محجوبة |
| لا اختبارات ML / توصيات قبل ثبوت البيانات والنطاق | T-LEAK / T-REPLAY / توصيات D3 مؤجلة |
| لا كود منتج في هذا التسليم | وثيقة فقط |
| لا تفعيل LLM | Gateway يبقى DISABLED + budget 0 |

---

## 2. مصادر الحقيقة المستخدمة (VERIFIED عند تاريخ هذا التحديث)

| المصدر | موقع / SHA | الاستخدام |
|---|---|---|
| `main` | `8ba4511629cb6f64e21ce9a7537c034cf77a9660` | مصدر الحقيقة المعتمد |
| PR #49 — SECURITY_QA_REVIEW_AR.md | branch `agent/CHATGPT-2/FC-002` @ `9a0ad7cf...` | SEC-001..SEC-008 + Test IDs الأمنية |
| PR #47 — AI providers | branch `agent/CHATGPT-1/FC-AI-03` @ `5c7926f0...` | adapters معطّلة؛ لا live calls |
| PR #45 — voice boundaries | branch `agent/CHATGPT-1/FC-AI-02` @ `5260d348...` | TTL تأكيد الصوت 20s |
| PR #52 — algorithm catalog | branch `agent/CHATGPT-1/FC-OSI-01` @ `22fc9277...` | ALG-01.. و Waves (وثائق فقط) |
| CAPTAIN_INTELLIGENCE_ALGORITHMS_AR.md | main | ALG-01..17 design only |
| backend/src/ai/* | main | Gateway DISABLED by default |

**ملاحظة**: main لا يحتوي حتى الآن مجلد `docs/testing/`؛ هذا الملف يعيش على فرع GROK-2 فقط حتى يُدمج PR.

---

## 3. ملخص التغطية الحالي

| الفئة | عدد الاختبارات المصممة | حالة التنفيذ | محجوب بقرار / ملاحظة |
|---|---|---|---|
| Isolation / Ownership | 4 | NOT_RUN | SEC-002 |
| Auth / Session | 4 | NOT_RUN | SEC-001 (P0) |
| Idempotency / Network | 2 | NOT_RUN | — |
| Shift lifecycle | 7 | NOT_RUN | — |
| Financial engine | 4 | NOT_RUN | **DEC-03** (BLOCKED) |
| Attachments / Export | 4 | NOT_RUN | SEC-005, SEC-007 |
| GPS / Privacy | 6 | NOT_RUN | DEC-10, SEC-004 |
| Persistence / Backup | 2 | NOT_RUN | SEC-003 |
| Audit / Logging | 2 | NOT_RUN | SEC-006 |
| KPI / Data quality | 2 | NOT_RUN | — |
| AI / Assistant safety | 6 | NOT_RUN | Gateway disabled; PR #47/#45 |
| PWA / RTL / Compat | 4 | NOT_RUN | DEC-08 جزئي |
| **المجموع التقريبي** | **~47** | **كلها NOT_RUN** | — |

---

## 4. مراحل تفعيل الاختبارات (Activation Stages)

| المرحلة | الشرط المسبق | الاختبارات المفعّلة | ملاحظة |
|---|---|---|---|
| **S0 — وثائق فقط** | الآن | لا شيء | الوضع الحالي |
| **S1 — بعد Stack (DEC-08) + Auth أساسي** | Backend + DB + Hosting + هوية موثقة | T-AUTH-*, T-ISO-*, T-IDEM-01, T-OWN-01, T-LOG-01, T-PERSIST-01 | Unit + API contract |
| **S2 — بعد DEC-03 + DEC-05 + DEC-09** | أمثلة شيفت ذهبية + عملة + تصنيفات | T-FIN-01..04 | Golden financial tests فقط بعد القرار |
| **S3 — بعد تفاصيل DEC-10** | سياسة احتفاظ/عينات GPS | T-GPS-01..05, T-PRIV-01 | Consent + retention |
| **S4 — Web/PWA جاهز** | واجهة قابلة للتشغيل + API | T-NET-01, T-RTL-01, T-GPS-04 | Integration + UI |
| **S5 — Android wrapper** | تغليف موجود | T-WV-01, T-COMPAT-01 | Cross-platform |
| **S6 — D2/D3 Intelligence** | بيانات كافية + نطاق خوارزميات معتمد + G0/G1 | T-KPI-01, T-DQ-01, T-ETA-01, T-REC-01, T-LEAK-01, T-REPLAY-01 | لا تبدأ قبل بوابات بشرية |

---

## 5. الاختبارات الحرجة مرتبة حسب الأولوية

### 5.1 P0 — يجب أن تمر قبل أي بيانات حقيقية أو نشر (مرتبطة بـ SEC-*)

| Test ID | يغطي | SEC ref | السيناريو المختصر | معيار PASS | حالة |
|---|---|---|---|---|---|
| T-ISO-01 | NFR-001, FR-009 | SEC-002 | حساب B يقرأ شيفت A | 403/404، لا بيانات | NOT_RUN |
| T-ISO-02 | NFR-001 | SEC-002 | B يعدل/يحذف/يصدر سجل A | مرفوض لكل endpoint | NOT_RUN |
| T-OWN-01 | FR-002 | SEC-002 | owner_user_id في الجسم يختلف عن الجلسة | يُتجاهل؛ يُستخدم مالك الجلسة | NOT_RUN |
| T-IDEM-01 | NFR-004 | — | تكرار POST بنفس Idempotency-Key | سجل واحد فقط | NOT_RUN |
| T-AUTH-01 | NFR-006 | SEC-001 | طلب بلا بيانات اعتماد / رمز غير صالح | 401 | NOT_RUN |
| T-AUTH-02 | FR-001, NFR-006 | SEC-001 | كلمة المرور مخزنة hash؛ rate limit | hash فقط؛ قفل | NOT_RUN |
| T-GPS-01 | NFR-009, DEC-10 | SEC-004 | إرسال نقاط بلا ConsentGrant | 403؛ لا تخزين | NOT_RUN |
| T-LOG-01 | NFR-010 | SEC-006 | فحص السجلات | لا كلمات مرور / Tokens / GPS خام | NOT_RUN |
| T-PERSIST-01 | — | SEC-003 | كتابة ثم restart | البيانات باقية بعد اعتماد DB | NOT_RUN |

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

### 5.5 سلامة المساعد والذكاء (AI Safety)

| Test ID | يغطي | المصدر | السيناريو | حالة |
|---|---|---|---|---|
| T-AST-01 | NFR-015/016 | — | طلب مبلغ أو قبول رحلة من المساعد | رفض / لا action | NOT_RUN |
| T-AST-02 | — | — | Prompt Injection داخل ملف | لا تنفيذ؛ يعامل كبيانات | NOT_RUN |
| T-AST-03 | NFR-013 | — | كل ادعاء رقمي | له Calculation ID / دليل | NOT_RUN |
| T-AI-01 | — | PR #47 | Gateway disabled + budget 0 ⇒ DISABLED | لا استدعاء مزود | NOT_RUN على CI الحالي (موجود في tests) |
| T-AI-02 | — | PR #45 | تأكيد صوت عند 20000 ms مقبول؛ 20001 ms مرفوض | حدود TTL مثبتة | NOT_RUN على main (موجود على فرع PR #45) |
| T-AI-03 | — | contracts | response لا يحتوي حقل action تنفيذي | عقد ثابت | NOT_RUN |

**ملاحظة**: اختبارات PR #45 و#47 موجودة على فروعهما وتنجح في GitHub Actions الخاصة بهما؛ لم تُدمج بعد في main. بعد الدمج تصبح FIXED_AND_TESTED على main.

---

## 6. ربط مباشر مع نتائج الأمن (PR #49)

| SEC ID | العنوان المختصر | Test IDs المرتبطة | حالة |
|---|---|---|---|
| SEC-001 | لا مصادقة إنتاجية | T-AUTH-01, T-AUTH-02 | NOT_RUN |
| SEC-002 | عزل الملكية | T-ISO-01, T-ISO-02, T-OWN-01 | PARTIAL (نواة) / NOT_RUN (HTTP+DB) |
| SEC-003 | تخزين مؤقت | T-PERSIST-01, T-BKP-01 | NOT_RUN |
| SEC-004 | GPS consent | T-GPS-01..05 | NOT_RUN |
| SEC-005 | مرفقات | T-ATT-01, T-ATT-02 | NOT_RUN |
| SEC-006 | تدقيق محدود | T-LOG-01 | PARTIAL / NOT_RUN |
| SEC-007 | تصدير/حذف | T-EXP-01, T-PRIV-01 | NOT_RUN |
| SEC-008 | تنقيح LLM غير كافٍ وحده | T-AI-01, T-AST-* | Gateway disabled = حماية إيجابية حالية |

---

## 7. متطلبات Fixtures (عند التنفيذ لاحقًا)

| Fixture | الغرض | قيود |
|---|---|---|
| `user_A` / `user_B` | اختبارات العزل | حسابان منفصلان، لا بيانات حقيقية |
| `shift_open_A` | دورة حياة | حالة OPEN |
| `shift_closed_A` | تصحيح / رفض | حالة CLOSED |
| `consent_granted` / `consent_revoked` | GPS | ConsentGrant صريح |
| `golden_shift_1` / `golden_shift_2` | T-FIN-* | **ممنوع إنشاؤها قبل DEC-03** |
| `idempotency_key_reuse` | T-IDEM-01 | نفس المفتاح مرتين |

---

## 8. أوامر مقترحة (عند وجود كود — حاليًا NOT_RUN على main)

```text
# أمثلة فقط — لا تُشغَّل الآن كدليل نجاح
# من جذر backend بعد اعتماد Stack:
npm test
npm run typecheck

# بعد دمج PR #45 / #47:
# npm test -- voice-boundaries
# npm test -- ai-providers
```

لا توجد أوامر اختبار مالية أو GPS أو توصيات قابلة للتشغيل على main الحالي.

---

## 9. الفجوات المتبقية بعد هذه الخطة

| الفجوة | السبب | الإجراء المطلوب |
|---|---|---|
| أرقام مالية ذهبية | DEC-03 مفتوح | Human Director يوفّر مثالَي شيفت |
| تصنيفات المصروف | DEC-05 مفتوح | قرار Human Director |
| العملة والتقريب | DEC-09 مفتوح | قرار (مقترح: EGP قرش صحيح) |
| مدة احتفاظ GPS | DEC-10 جزئي | قرار سياسة |
| Stack نهائي | DEC-08 جزئي | قرار Backend/DB/Hosting |
| مصادقة إنتاجية | SEC-001 | تصميم + تنفيذ بعد قرار |
| اختبارات متصفح حقيقية | لا واجهة كاملة بعد | بعد S4 |
| خوارزميات ذكاء runtime | وثائق فقط (PR #52) | بعد G0/G1 وبيانات |

---

## 10. التوصيات لـ MOSAAB (لتقدم البناء)

1. إبقاء كل الاختبارات في حالة **NOT_RUN** حتى يتوفر كود قابل للتشغيل على main.
2. عدم قبول أي PR يدّعي نتائج اختبار مالية قبل إغلاق DEC-03.
3. إعطاء أولوية لدمج/مراجعة:
   - PR #45 (voice TTL) — اختبارات موجودة وتنجح
   - PR #47 (AI providers disabled) — اختبارات موجودة وتنجح
   - PR #49 (security review) — مرجع اختبارات P0
4. بعد اختيار Stack (S1) يبدأ تنفيذ T-ISO / T-AUTH / T-IDEM كأول دفعة حقيقية.
5. ربط كل اختبار لاحقًا بـ CI check حقيقي (Issue #9 — MANUS-2).
6. لا تبدأ شريحة ALG-01 runtime قبل إغلاق البوابات ذات الصلة ووجود بيانات اصطناعية كافية.

---

## 11. التسليم

- **STATUS**: READY_FOR_REVIEW
- **ROLE**: GROK-2
- **ISSUE**: #7
- **BASE_SHA**: `8ba4511629cb6f64e21ce9a7537c034cf77a9660` (main)
- **HEAD_SHA**: (يُحدَّث بعد هذا الـcommit)
- **CHANGED_PATHS**:
  - `docs/testing/TEST_EXECUTION_BLUEPRINT_AR.md`
- **TEST_COMMANDS**: لا يوجد تشغيل جديد (وثائقي)
- **ACTUAL_RESULTS**: NOT_REQUIRED — لا اختبارات نُفذت في هذه الشريحة
- **VERIFIED**: وجود Gateway معطل، وجود اختبارات على فروع PR #45/#47، محتوى PR #49، غياب runtime للخوارزميات
- **UNKNOWN / BLOCKED**: DEC-03, DEC-05, DEC-09, تفاصيل DEC-10, DEC-08
- **RISKS**: وكلاء يقرؤون main فقط لن يروا هذا الملف حتى يُدمج PR؛ أي تنفيذ مالي مبكر
- **PR**: يُفتح كـ Draft مرتبط بـ #7
- **NEXT_AGENT_ROLE**: MOSAAB للمراجعة والقرار؛ ثم CHATGPT-2 أو MANUS-2 حسب التوجيه لربط CI

---

*هذه وثيقة تصميم اختبارات فقط. لا نتائج تنفيذ وهمية، لا كود منتج، لا دمج. MOSAAB وحده يعتمد.*
