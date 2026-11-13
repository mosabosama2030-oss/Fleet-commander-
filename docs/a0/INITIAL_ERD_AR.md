# ERD أولي — A0-14

- الحالة: PROPOSED — مسودة لا تعتمد قبل DEC-01/02/05/06/12/13
- الجلسة: 01
- مبادئ: الملكية تُستخرج من الجلسة لا من العميل · المبالغ أعداد صحيحة بالقرش مع `currency` · الحذف المنطقي للسجلات المالية · كل تصحيح يترك AuditEvent.

```mermaid
erDiagram
  UserAccount ||--|| CaptainProfile : has
  UserAccount ||--o{ Vehicle : owns
  UserAccount ||--o{ Shift : owns
  Vehicle ||--o{ Shift : used_in
  Shift ||--o{ OdometerReading : has
  Shift ||--o{ Trip : has
  Shift ||--o{ RevenueEntry : has
  Shift ||--o{ ExpenseEntry : has
  Shift ||--o{ Settlement : settled_by
  Trip ||--o{ RevenueEntry : yields
  UserAccount ||--o{ Attachment : owns
  Attachment ||--o{ OdometerReading : proves
  Attachment ||--o{ ExpenseEntry : proves
  Attachment ||--o{ Settlement : proves
  UserAccount ||--o{ AuditEvent : acts
  UserAccount ||--o{ ConsentGrant : grants
  UserAccount ||--o{ SourceRecord : provides
  UserAccount ||--o{ KPIRecord : has
  UserAccount ||--o{ Recommendation : receives
  Recommendation ||--o{ RecommendationFeedback : gets
  PredictionRun }o--|| ModelVersion : uses
  Recommendation }o--o| PredictionRun : from
```

## قيود مقترحة
| الكيان | قيود |
|---|---|
| Shift | `owner_user_id` NOT NULL؛ `vehicle_id` ينتمي لنفس المالك؛ شيفت واحد OPEN لكل مالك (إن اعتمد DEC) ؛ `ended_at >= started_at`؛ التوقيت من الخادم |
| OdometerReading | `phase ∈ {start,end}` فريد لكل شيفت؛ `end >= start` |
| RevenueEntry/ExpenseEntry | `amount_minor >= 0`؛ `currency` إلزامي؛ `source` إلزامي؛ `idempotency_key` فريد لكل مالك |
| Settlement | `status ∈ {pending,confirmed,rejected}`؛ مسجلة ≠ مؤكدة |
| Attachment | تخزين خاص؛ `checksum`، `media_type`، `size` ؛ تنزيل بتفويض |
| AuditEvent | append-only |
| Recommendation | `valid_until`، `confidence`، `sample_size`، `model_version`، `source_refs` إلزامية |
| ConsentGrant | `purpose`، `scope`، `retention`، `granted_at`، `revoked_at` |

## نقاط مفتوحة
- المنطقة (Zone/H3) كعمود في Trip أم كيان؟ (DEC-10)
- تمثيل Correction: سجل تصحيح منفصل أم إصدارات؟ (DEC-06)
- ERD معتمد = شرط G1؛ هذا ليس ERD معتمدًا.
