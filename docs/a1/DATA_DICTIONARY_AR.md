# قاموس البيانات — A1-04 (مسودة PROPOSED، الحقول غير المالية فقط)

الحقول المالية (الصيغ/الأنواع المشتقة) محجوبة حتى DEC-03. المبالغ المدخلة: `amount_minor` (عدد صحيح بالقرش) + `currency`.

| الكيان.الحقل | النوع | قيود | ملاحظة |
|---|---|---|---|
| UserAccount.id | UUID | PK | |
| UserAccount.login_identifier | text | فريد | بريد (DEC-07) |
| UserAccount.password_hash | text | NOT NULL | لا نص صريح |
| CaptainProfile.user_id | UUID | PK, FK | 1:1 |
| Vehicle.id / owner_user_id / label / plate_ref / status | UUID/UUID/text/text/enum(active,retired) | owner من الجلسة | |
| Shift.id / owner_user_id / vehicle_id | UUID | FK، المركبة لنفس المالك | |
| Shift.status | enum(OPEN,CLOSED,CANCELLED) | | |
| Shift.started_at / ended_at | timestamptz | وقت الخادم؛ ended >= started | تخزين UTC، عرض Africa/Cairo |
| Shift.operating_date | date | = تاريخ البدء بتوقيت القاهرة (DEC-04) | |
| OdometerReading.phase | enum(start,end) | فريد لكل (shift,phase) | |
| OdometerReading.value_km | integer | >= 0؛ end >= start | |
| OdometerReading.attachment_id | UUID? | FK | DEC-12 |
| Trip.id / shift_id / source / occurred_at | UUID/UUID/enum/timestamptz | | DEC-02 |
| RevenueEntry.amount_minor / currency / source / idempotency_key | int/char(3)/enum/text | >=0؛ مفتاح فريد لكل مالك | |
| ExpenseEntry.category | enum | DEC-05 | |
| ExpenseEntry.amount_minor / occurred_at / note | int/timestamptz/text | >=0 | |
| Settlement.status | enum(PENDING,CONFIRMED,REJECTED) | | DEC-13 |
| Attachment.storage_key / media_type / size_bytes / checksum_sha256 | text/text/int/text | خاص؛ تنزيل بتفويض | |
| AuditEvent.actor_user_id / entity_type / entity_id / action / reason / occurred_at | | append-only | |
| ConsentGrant.purpose / scope / retention_days / granted_at / revoked_at | | | DEC-10 |

## تشتق لاحقًا (لا تُخزن كحقيقة)
KPIs: الصيغة والفترة والمصدر وحجم العينة وحداثة البيانات مع كل قيمة (D2).
