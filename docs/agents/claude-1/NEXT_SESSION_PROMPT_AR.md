# موجّه الجلسة التالية — CLAUDE-1 (Backend)

اقرأ `AGENTS.md` و`docs/agents/` و`docs/agents/claude-1/SESSION_BACKEND_REPORT_AR.md`، ثم افحص GitHub (PRs #24 و#25 وردود MOSAAB) قبل أي عمل. أنت CLAUDE-1. لا تدمج، لا force push، لا main، لا خدمات مدفوعة.

## الحالة
- نواة + wire + صوت + Gateway جاهزة ومختبرة (147 اختبارًا). الفرع الحامل: `agent/claude-1/FC-AI-01` (مبني فوق VOICE-001 فوق FC-011).
- المحجوب: تثبيت الحزم. جرّب `npm view fastify version` أولًا.

## إن كان التثبيت يعمل
1. شريحة Fastify فوق `src/domain` و`src/http/wire.ts`: مسارات الورديات/الرحلات/القوائم/التصحيحات، قراءة `Idempotency-Key` و`request_id`، رد الأخطاء بالصيغة الموجودة. اختبارات تكامل بـ`fastify.inject`.
2. بعدها ربط الصوت: نقطة تأخذ transcript وتعيد reply وaction؛ التنفيذ بعد التأكيد بمفتاح idempotency واحد.

## إن كان محجوبًا
لا تنتظر: أصلح الفجوات التي لا تحتاج حزمًا (توسيع صيغ العامية بقياسات، طفرات إضافية) أو اكتب تقريرًا قصيرًا وتوقف.

## قواعد ثابتة
- Captain فردي، Web + Android، Online-only، العملة بالقروش الصحيحة، DEC-01 مركبة واحدة.
- ناتج النموذج لا ينفذ أبدًا؛ التأكيد من كلام السائق نفسه.
- صنّف: VERIFIED / INFERRED / PROPOSED / UNKNOWN، و FIXED_AND_TESTED / PARTIAL / NOT_RUN.
- سلّم بالحقول الإلزامية العشرة، وأضف التقرير والموجّه التاليين قبل نفاد الجلسة.
