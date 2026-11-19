# تعديلات العقد المقترحة بعد قراري MOSAAB (O-01 / O-03)

- المالك: CLAUDE-1 — Issue #17 (FC-011) — الحالة: **PROPOSED** (قرار المنتج VERIFIED من MOSAAB؛ صياغة العقد لم تُدمج)
- القرار (MOSAAB، 2026-11-16، في المحادثة): **O-01** استبدال المركبة مسموح. **O-03** إضافة مسار إلغاء الشيفت.
- هذه الوثيقة **لا تعدّل** ملفات `session/05-tech-auth-gps` (غير مدمج، ملكية غيري). هي دلتا جاهزة للدمج في العقد، تحتاج تنسيق CLAUDE-2 (واجهة) وGROK-1 (مراجعة معمارية).

## 1) O-01 — استبدال المركبة (DEC-01 مفسَّر: «مركبة نشطة واحدة في كل وقت»)

مطبَّق في النواة ومختبر (33 اختبارًا): `retireVehicle` + رفض شيفت على مركبة مسحوبة.

دلتا `OPENAPI_CORE_AR.yaml` (PROPOSED):
```yaml
/vehicles/{id}:
  patch:
    summary: Update my vehicle. status=retired يسحب المركبة (O-01).
    requestBody: { content: { application/json: { schema: { type: object, additionalProperties: false, properties: { label: { type: string, maxLength: 60 }, plate_ref: { type: string, maxLength: 20 }, status: { type: string, enum: [retired] } } } } } }
    responses:
      '200': { description: ok }
      '404': { $ref: '#/components/responses/NotFound' }
      '409': { description: already retired, or a shift is OPEN on this vehicle }
      '422': { $ref: '#/components/responses/Validation' }
```
قواعد (VERIFIED بالاختبار في النواة):
- السحب يتطلب أن لا يكون على المركبة شيفت `OPEN` (409).
- السحب مرتين = 409. مركبة كابتن آخر أو غير موجودة = 404.
- بدء شيفت على مركبة `retired` = 409 (`POST /shifts` يضيف 409 لهذه الحالة).
- الشيفتات القديمة تبقى مرتبطة بمركبتها؛ لا حذف.
- `AuditEvent`: `vehicle.retire`.

غير مطبَّق (UNKNOWN/خارج النطاق): تعديل `label`/`plate_ref` عبر PATCH (النواة لا تدعمه ولا `plate_ref`)، وIdempotency-Key على السحب (O-02).

## 2) O-03 — مسار إلغاء الشيفت

مطبَّق في النواة منذ الشريحة 1 (`cancelShift`) ومختبر: السبب إلزامي، OPEN فقط، لا إعادة فتح.

دلتا `API_DRAFT.openapi.yaml` (PROPOSED):
```yaml
/shifts/{id}/cancel:
  post:
    summary: Cancel an OPEN shift (started by mistake). Reason required; no deletion; creates AuditEvent.
    parameters: [ { name: id, in: path, required: true, schema: { type: string, format: uuid } }, { $ref: '#/components/parameters/IdempotencyKey' } ]
    requestBody: { required: true, content: { application/json: { schema: { type: object, additionalProperties: false, required: [reason], properties: { reason: { type: string, minLength: 1, maxLength: 500 } } } } } }
    responses:
      '200': { description: cancelled, content: { application/json: { schema: { $ref: '#/components/schemas/Shift' } } } }
      '404': { description: not found or not owned }
      '409': { description: shift is not OPEN }
      '422': { description: reason missing }
```
دلتا `DATA_DICTIONARY_AR.md`: صف جديد `Shift.cancel_reason | text? | إلزامي عند status=CANCELLED، ويبقى NULL غير ذلك`.
دلتا مخطط `Shift` في العقد: إضافة `cancel_reason: { type: string, nullable: true }`.

أسئلة صغيرة لم أخترع إجابتها (UNKNOWN، تحتاج قرارًا لاحقًا):
- هل تبقى الرحلات المسجلة في شيفت أُلغي تُحتسب في التقارير أم تُستبعد؟ (النواة تتركها كما هي ولا تفترض).
- حدّ طول `reason` المقترح 500 (مطابق للنواة)؛ غير معتمد.
- هل يُسمح بالإلغاء بعد تسجيل رحلات؟ (النواة تسمح؛ لا قاعدة معتمدة).

## 3) أثر على CONTRACT_RECONCILIATION_AR.md
O-01 وO-03 انتقلا من «مفتوح» إلى «قرار + دلتا مقترحة» (هذه الوثيقة). بقية الفروق (O-02، O-04..O-10) كما هي.
