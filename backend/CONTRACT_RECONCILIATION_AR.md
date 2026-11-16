# مطابقة نواة Backend مع عقود API/ERD — FC-011 (الزيادة 1b)

- المالك: CLAUDE-1 — Issue #17 — الحالة: **PARTIAL**
- الكود المقارَن: `agent/claude-1/FC-011` @ `d48af65e57bb690665497db74b32a74b714c197a` (+ هذه الزيادة)
- العقود المقارَن بها (فرع `session/05-tech-auth-gps` @ `fd0805a579daad06922fe654173bdc30159d6b4f`، **غير مدمج، وكلها PROPOSED**):
  `docs/a1/OPENAPI_CORE_AR.yaml`، `docs/a0/API_DRAFT.openapi.yaml`، `docs/a1/DATA_DICTIONARY_AR.md`
- المنهج: قراءة الملفات عند الـSHA المذكور + قراءة كود النواة + تشغيل الاختبارات. لا مقارنة آلية بين OpenAPI والكود (NOT_RUN).
- القاعدة: لا تغيير لعقد API هنا. صُحّح في الكود **فقط** ما يطابق نص العقد دون قرار جديد؛ كل فرق آخر مسجَّل أدناه للقرار.

## 1) فروق صُحّحت في هذه الزيادة (VERIFIED بالاختبار)

| # | العقد | قبل | بعد | اختبار |
|---|---|---|---|---|
| R-01 | `Error.code` enum: `VALIDATION_FAILED`، `IDEMPOTENCY_KEY_REUSED` | `VALIDATION`، `IDEMPOTENCY_MISMATCH` | مطابق | كل اختبارات الرفض |
| R-02 | `responses.Conflict` = «Conflict or idempotency mismatch» (409) | تلميح 422 | 409 | `maps wire codes and HTTP hints…` |
| R-03 | `IdempotencyKey` طول 16..128 | حد أقصى فقط | 16..128 | `enforces the Idempotency-Key length contract` (15/16/128/129) |
| R-04 | `VehicleCreate.label` maxLength 60 | 100 | 60 | `enforces the contract label length limit` (60/61) |

تحقق التحوير على نسخة مؤقتة: تحوير كل قاعدة من الأربع كسر اختبارًا واحدًا بالضبط (29 ناجحًا / 1 فاشل)، والنسخة الأصلية 30/30.

## 2) فروق مفتوحة (لم تُعالَج عمدًا)

| # | الفرق | التصنيف | يحتاج |
|---|---|---|---|
| O-01 ✅ | العقد: إنشاء مركبة ثانية = 409 حتى تُسحب الأولى عبر `PATCH status=retired`، والكيان فيه `plate_ref` وحالة `retired`. النواة: حالة `active` فقط ولا سحب ولا `plate_ref`؛ فالكابتن الذي يغيّر سيارته لا يستطيع تسجيل غيرها أبدًا. | VERIFIED (قراءة الكود والعقد) | **قرار MOSAAB 2026-11-16: نعم، الاستبدال مسموح** → نُفّذ في النواة (`retireVehicle`، 33 اختبارًا)؛ الدلتا في `CONTRACT_DELTA_O01_O03_AR.md`. بقي: `plate_ref` وتعديل label عبر PATCH. |
| O-02 | العقد يشترط `Idempotency-Key` على `POST /vehicles` و`/shifts` و`/shifts/{id}/end` و`/shifts/{id}/trips` و`/trips/{id}/void` و`/shifts/{id}/corrections` (وكذلك cancel حسب الدلتا). | **عولج في النواة (الزيادة 1c)** — مخزن موحد؛ نفس المفتاح+الحمولة ⇒ نفس النتيجة بلا تنفيذ ولا تدقيق ثانٍ؛ حمولة/عملية مختلفة ⇒ `IDEMPOTENCY_KEY_REUSED`؛ الفشل لا يستهلك المفتاح؛ المفتاح اختياري في النواة. | فرض وجود الترويسة وتعيين 409 في طبقة HTTP (O-10)؛ ADR-006 ما زال PROPOSED |
| O-03 ✅ | `cancelShift` موجود في النواة (مع `cancelReason`) ولا مسار له في `API_DRAFT`، ولا حقل `cancel_reason` في قاموس البيانات، رغم أن `Shift.status` يتضمن `CANCELLED`. | VERIFIED | **قرار MOSAAB 2026-11-16: نعم، أضف المسار** → النواة جاهزة أصلًا؛ دلتا العقد (`POST /shifts/{id}/cancel` + `cancel_reason`) في `CONTRACT_DELTA_O01_O03_AR.md`، PROPOSED حتى تنسيق CLAUDE-2 ومراجعة GROK-1. |
| O-04 | القاموس: `OdometerReading` كيان مستقل (`phase`، `value_km`، `attachment_id`). النواة: `startOdometerKm/endOdometerKm` داخل Shift، وأسماء حقول التصحيح (`shift.start_odometer_km`) مبنية على ذلك. مخطط `Shift` في `API_DRAFT` بلا عداد ولا `operating_date`. | VERIFIED | حسم النمذجة قبل شريحة قاعدة البيانات (تأثير على حقول Correction) |
| O-05 | القاموس: `Correction.entity_type`. النواة تشتقه من بادئة `field` ولا تخزنه. | VERIFIED | قرار تصميم صغير (تخزين أو اشتقاق) عند شريحة DB |
| O-06 | تناقض داخل الوثائق: `Money` كائن `{amount_minor, currency}` في `API_DRAFT`، وحقول مسطحة `fare_minor + currency` في القاموس. النواة camelCase (`amountMinor`). وتكرار `Trip.fare_minor` مقابل `RevenueEntry` (استنتاج الجلسة 04) لم يُحسم. | VERIFIED | شكل سلكي واحد يُعتمد؛ ومرتبط بـDEC-03/DEC-09 |
| O-07 | `void` في `API_DRAFT` يذكر `200` فقط؛ النواة ترفض الإبطال على شيفت مغلق بـ409 (يلزم تصحيح) وترجع 404/422. و`POST /shifts` يذكر 201/409 فقط؛ النواة ترجع 404 (مركبة غير موجودة) و422. | VERIFIED | إكمال استجابات العقد (تغيير عقد → توثيق وموافقة) |
| O-08 | العقد: `GET /shifts` و`GET /shifts/{id}/trips` بترقيم cursor. | **عولج في النواة (الزيادة 1c)** — `listVehicles/listShifts/listTrips` بشكل `Page{items,nextCursor}`، `limit` 1..100 (الافتراضي 25)، مؤشر معتم تالفه ⇒ `VALIDATION_FAILED`، ترتيب الإنشاء، قيم فعّالة مع بقاء VOIDED. | الترتيب النهائي للقائمة وفلاتر `status/from/to` UNKNOWN: قرار عقد لاحق |
| O-09 | المعرّفات `format: uuid` في العقد؛ النواة تأخذ مولّد معرّفات محقونًا (الاختبارات `id-1`…) ولا تفرض UUID. | VERIFIED | طبقة HTTP/DB تولّد UUID؛ لم تُختبر (NOT_RUN) |
| O-10 | «المالك دائمًا من الجلسة لا من الجسم»: النواة تأخذ `ownerUserId` معاملًا منفصلًا ولا تقرؤه من حمولة الإدخال (تصميم متوافق). التحقق أن طبقة HTTP تستمده من الجلسة وترفض الحقول المجهولة غير موجود بعد. | INFERRED | اختبار HTTP في شريحة Fastify |

## 3) ما يتطابق (VERIFIED بقراءة الكود والعقد)
- قيم `Shift.status`: `OPEN/CLOSED/CANCELLED`؛ `Trip.status`: `RECORDED/VOIDED`؛ قائمة المنصات `uber, didi, careem, indrive, other` (قائمة المنصات نفسها PROPOSED في القاموس).
- `operating_date` = تاريخ البدء بتوقيت Africa/Cairo، والتخزين UTC (DEC-04).
- التصحيح: على شيفت `CLOSED` فقط، السبب إلزامي، سجل append-only بلا إعادة فتح، 409 إن لم يكن الشيفت مغلقًا (DEC-06).
- عزل الملكية: بيانات كابتن آخر تُرجع `NOT_FOUND` (يطابق «Not found OR not owned»).

## 4) ما لم يُنجَز
- مقارنة آلية بين OpenAPI والكود: NOT_RUN. لا Fastify/HTTP، ولا PostgreSQL، ولا مصادقة (DEC-07)، ولا GPS/Consent (DEC-10)، ولا مصروفات (DEC-05).
- المحرك المالي: BLOCKED بـDEC-03.
- العقود المقارَنة بها غير مدمجة؛ إن تغيّرت في `session/05` أو PR #1 فالمطابقة تُعاد.
