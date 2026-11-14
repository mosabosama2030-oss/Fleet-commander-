# State Machines — A1-02 (مسودة PROPOSED)

- لا تعتمد قبل DEC-06 (التعديل بعد الإغلاق) وDEC-13 (التسوية).
- لا تتضمن أي قاعدة مالية.

## 1. الشيفت
```mermaid
stateDiagram-v2
  [*] --> OPEN: start (عداد بداية صالح)
  OPEN --> CLOSED: end (عداد نهاية >= بداية)
  OPEN --> CANCELLED: cancel (سبب + AuditEvent)
  CLOSED --> CLOSED: correction (append-only، سبب، AuditEvent)
  CANCELLED --> [*]
```
| الانتقال | شرط | رفض |
|---|---|---|
| start | مركبة مملوكة؛ لا شيفت OPEN آخر (إن اعتمد) | 409 |
| end | الحالة OPEN؛ end_odometer >= start | 409/422 |
| correction | CLOSED فقط؛ سبب إلزامي | 422 |
| أي انتقال من حالة طرفية | — | 409 |

## 2. التسوية (Settlement)
```mermaid
stateDiagram-v2
  [*] --> PENDING: record
  PENDING --> CONFIRMED: confirm (دليل/مصدر موثوق)
  PENDING --> REJECTED: reject (سبب)
  REJECTED --> PENDING: re-record
```
القاعدة: «مسجلة» لا تساوي «مؤكدة» (FR-013).

## 3. الرحلة (Trip) — شرطي بـDEC-02
`RECORDED → VOIDED` فقط (إلغاء منطقي بسبب)، بلا حذف.

## 4. التوصية (Recommendation) — D3
`ISSUED → ACCEPTED | DISMISSED | EXPIRED` (انتهاء `valid_until`). القرار النهائي للكابتن.

## اختبارات مرتبطة
T-SH-01..04، T-SET-01.
