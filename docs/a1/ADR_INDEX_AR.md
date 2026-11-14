# فهرس قرارات المعمارية (ADR) — A1-09 (مسودة)

كل ADR بحالة PROPOSED حتى توقيع Human Director.

| ADR | القرار المقترح | البدائل | يعتمد على |
|---|---|---|---|
| ADR-001 | Modular Monolith | Microservices | الخطة §4 |
| ADR-002 | PostgreSQL كمصدر الحقيقة | SQLite/NoSQL | DEC-08 |
| ADR-003 | عقد OpenAPI واحد لـWeb وAndroid | واجهتان | FR-015 |
| ADR-004 | المبالغ كأعداد صحيحة بالقرش | Decimal | DEC-09 |
| ADR-005 | تصحيح append-only مع AuditEvent | تعديل مباشر | DEC-06 |
| ADR-006 | Idempotency-Key لكل كتابة مالية | لا شيء | NFR-004 |
| ADR-007 | الحساب المالي خارج LLM | — | NFR-015 (VERIFIED بالخطة) |
| ADR-008 | **GPS أثناء الشيفت بموافقة صريحة (DEC-10 VERIFIED)**؛ في PWA يعمل في الواجهة الأمامية فقط (قيد منصة — INFERRED)؛ التتبع بالخلفية الموثوق يحتاج تغليف Android | بلا GPS | DEC-10، ADR-009 |
| ADR-009 | **PWA متجاوب أولًا؛ Android لاحقًا كتغليف (DEC-08 VERIFIED جزئيًا)** — يقتضي مراجعة T-14 (WebView) عند التغليف | Native/Flutter | DEC-08 |
| ADR-010 | بريد + كلمة مرور واستعادة بالبريد | OTP/مزود هوية | DEC-07 VERIFIED |
