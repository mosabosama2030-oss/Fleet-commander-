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
| ADR-008 | بلا GPS مستمر في MVP | GPS مستمر بموافقة | DEC-10 |
| ADR-009 | Web أولًا متجاوب؛ Android قرار منفصل (PWA/WebView/Native) | — | DEC-08 |
