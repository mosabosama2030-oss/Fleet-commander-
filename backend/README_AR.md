# Backend — نواة النطاق (الشريحة 1 + مطابقة العقد 1b / FC-011)

- Issue: #17 — المالك: CLAUDE-1 — الحالة: **PARTIAL** (نواة نطاق مختبرة؛ لا HTTP ولا قاعدة بيانات بعد)
- الأساس: G0+G1 ممنوحتان من Human Director (2026-11-15)، Backend A (Node.js + TypeScript)، تطوير محلي فقط.

## ما الموجود (VERIFIED بالاختبار)
`src/domain/` بلا اعتمادات تشغيل:
- `money.ts`: أعداد صحيحة بالقرش، ترفض الكسور والسالب والنصوص (ADR-004 **PROPOSED**، DEC-09 غير محسوم).
- `time.ts`: يوم الشيفت بتوقيت Africa/Cairo (DEC-04).
- `fleet-service.ts`: مركبة نشطة واحدة مع إمكان الاستبدال بسحب القديمة (DEC-01 + O-01)، شيفت OPEN→CLOSED/CANCELLED، رحلات برحلة (DEC-02) مع إبطال بسبب، تصحيح append-only بعد الإغلاق بلا إعادة فتح (DEC-06)، Idempotency موحد لكل العمليات المغيِّرة (لكل كابتن، O-02)، قوائم بترقيم cursor (O-08)، سجل تدقيق، عزل الملكية (404 للبيانات الأخرى).

## مطابقة العقد (الزيادة 1b)
رموز الأخطاء وتلميحات HTTP وحدود الأطوال (Idempotency-Key 16..128، اسم المركبة 60) مطابقة لـ`OPENAPI_CORE_AR.yaml` (PROPOSED، فرع session/05 غير المدمج). O-01 (استبدال المركبة) وO-03 (مسار الإلغاء) حُسما بقرار MOSAAB 2026-11-16 — انظر [`CONTRACT_DELTA_O01_O03_AR.md`](./CONTRACT_DELTA_O01_O03_AR.md). الفروق المفتوحة (نمذجة العداد، فروق O-04..O-10، …) مفصّلة في [`CONTRACT_RECONCILIATION_AR.md`](./CONTRACT_RECONCILIATION_AR.md) ولم تُعالج لأنها تحتاج قرارًا أو تغيير عقد.

## ما غير موجود (NOT_RUN / BLOCKED)
- **المحرك المالي**: محجوب بـDEC-03 (مثالا شيفت). لا معادلات هنا.
- Fastify وHTTP، PostgreSQL، المصادقة (DEC-07)، ConsentGrant/GPS (DEC-10)، المصروفات (DEC-05)، التسوية (DEC-13): لم تبدأ.
- التخزين في الذاكرة مؤقت؛ لا استمرارية.

## التشغيل
```
cd backend
npm test          # node --test (يتطلب Node >= 22.18 لتشغيل TypeScript مباشرة)
npm run typecheck # يتطلب typescript و@types/node
```
لا توجد اعتمادات مُعلنة في `package.json` عمدًا: تثبيت الحزم لم يكن متاحًا في بيئة الجلسة، فلم أُثبّت إصدارات لم أتحقق منها.

## قرارات تصميم (INFERRED/PROPOSED)
- لا قيود على `occurredAt` سوى صيغة ISO-UTC (لا نطاق زمني): فجوة تحتاج قرارًا.
- رفض بدء شيفت ثانٍ والأول OPEN: قاعدة PROPOSED في STATE_MACHINES (الفرع session/05 غير المدمج).
- مفتاح الـIdempotency مقيّد بالكابتن؛ إعادة نفس المفتاح بحمولة أو عملية مختلفة ⇒ `IDEMPOTENCY_KEY_REUSED` (تلميح 409).
- `httpHint` في الأخطاء تلميح فقط؛ تعيين HTTP الفعلي في طبقة API لاحقًا ولا يغيّر عقد OpenAPI.
