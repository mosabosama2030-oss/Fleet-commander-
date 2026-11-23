# Runbook التشغيل — Fleet Commander

**Task:** FC-012
**Role:** MANUS-2 — Operations & Release Engineer
**الحالة:** `PARTIAL` — هذا Runbook توثيقي؛ لا يثبت وجود بيئة Staging أو Production.

## تصنيف الأدلة

- **VERIFIED:** `main` عند إعداد FC-012 يحتوي على Backend وWeb وWorkflows CI موجودة، وملف Smoke Test في هذا الفرع.
- **PROPOSED:** بوابات الإصدار، حدود التنبيه، أسماء البيئات، وخطوات التراجع أدناه.
- **UNKNOWN:** مزود الاستضافة، عنوان Staging، health/readiness الفعلي، Secret Manager، وإجراء Backup/Restore الفعلي.

## 1. قبل بدء العمل

1. اربط التغيير بـIssue وفرع مستقل وBase SHA واضح.
2. تحقق من أن `main` لم يتغير أثناء المراجعة.
3. اقرأ PR والملفات المتأثرة؛ لا تعدل Workflow أو عقد API يملكها وكيل آخر دون تنسيق.
4. استخدم بيانات اختبار منزوعة الهوية فقط.
5. لا تضع tokens أو كلمات مرور أو dumps في Git أو logs أو artifacts.

## 2. التطوير والاختبار المحلي

### Backend

```bash
cd backend
npm test
npm run typecheck
```

### Web

```bash
node --check web/app.js
python -m unittest discover -s web -p 'test_*.py' -v
```

### Smoke Test

```bash
BASE_URL=https://staging.example ./scripts/smoke_test.sh
BASE_URL=https://staging.example HEALTH_PATH=/health READINESS_PATH=/ready ./scripts/smoke_test.sh
```

لا تستخدم عنوان Production في اختبار محلي. إذا لم توجد بيئة معتمدة، تكون النتيجة `NOT_RUN` أو `UNKNOWN`، ولا تُستبدل بعنوان مخترع.

## 3. Staging

### شروط الدخول

- اعتماد التقنية والبيئة من MOSAAB.
- Artifact مرتبط بـcommit SHA واضح.
- بيانات Staging وهمية أو منزوعة الهوية.
- أسرار Staging منفصلة عن Production ومخزنة في Secret Manager معتمد.
- migrations مجربة على نسخة Staging.

### خطوات القبول

1. تحقق من عنوان البيئة وشهادة TLS.
2. شغّل `scripts/smoke_test.sh` مع `BASE_URL` المعتمد.
3. نفذ سيناريو تسجيل دخول بحساب اختبار غير حقيقي، إن كان مسار المصادقة معتمداً.
4. تحقق من أن الحفظ لا يعرض نجاحاً قبل إقرار الخادم.
5. تحقق من عزل بيانات Captain وعدم قبول معرفات أو صلاحيات من العميل.
6. راجع logs بحثاً عن tokens أو بيانات شخصية.
7. سجل SHA والوقت والبيئة والأمر والنتيجة.

### معايير الفشل الحرج

أوقف القبول عند فشل health/readiness، أو تسريب secret، أو فشل عزل البيانات، أو فقد بيانات، أو نجاح واجهة غير مدعوم باستجابة خادم، أو عدم قابلية migration للرجوع.

## 4. الإصدار

1. تحقق من موافقة PR ومراجعة مستقلة.
2. تحقق من نجاح CI المطلوب ووجود artifact immutable.
3. سجل digest وcommit SHA قبل نافذة الإصدار.
4. تحقق من backup/restore evidence وفق قائمة التحقق المستقلة.
5. نفذ الإصدار فقط بقرار MOSAAB وبأداة المزود المعتمد.
6. شغّل Smoke Test بعد الإصدار.
7. راقب health و5xx وlatency ضمن نافذة مراقبة معلنة.
8. سجّل النتيجة أو افتح incident عند الفشل.

هذه الخطوات لا تمنح الوكيل صلاحية نشر Production.

## 5. التراجع

1. أعلن incident وحدد المسؤول ووقت البدء.
2. أوقف الإصدار أو التوسع الجاري.
3. حدد آخر artifact سليم بالـSHA والدigest.
4. أعد artifact السابق وفق إجراء المزود المعتمد.
5. لا تعكس migration مدمرة تلقائياً؛ اتبع خطة migration متوافقة أو استعادة معتمدة.
6. أعد Smoke Test وتحقق من المصادقة وعزل البيانات.
7. راقب مؤشرات الصحة بعد التراجع.
8. وثق السبب الجذري، الأثر، الإجراء التصحيحي، وIssue المتابعة.

## 6. الحوادث

- **P0:** تسريب سر، عزل بيانات مكسور، فقد بيانات، أو عدم توفر أساسي. أوقف التغيير وصعّد فوراً إلى MOSAAB.
- **P1:** فشل متكرر في health/readiness أو أخطاء خادم واسعة دون دليل تسريب. جمّد الإصدار وابدأ التحقيق.
- **P2:** خلل محدود لا يمنع الاستخدام الأساسي. افتح Issue مع logs منزوعة الحساسية.

لا تُدرج بيانات شخصية أو credentials في تقرير الحادث. استخدم request/correlation ID فقط عندما يكون متاحاً.

## 7. بوابات الإغلاق

| البوابة | الدليل المطلوب | الحالة الحالية |
|---|---|---|
| CI | سجل GitHub Actions ناجح للـcommit | `VERIFIED` للـworkflows الموجودة فقط؛ نتائج التشغيل تعتمد على GitHub |
| Smoke | مخرجات `scripts/smoke_test.sh` على Staging معتمدة | `UNKNOWN` دون عنوان بيئة معتمد |
| Backup/Restore | سجل Restore ناجح وRPO/RTO مقاسان | `UNKNOWN` |
| Release | قرار MOSAAB وartifact digest | `UNKNOWN` |
| Rollback | تجربة تراجع ناجحة على Staging | `UNKNOWN` |

## 8. ما لا ينفذه هذا Runbook

لا ينشئ بيئات، ولا يضيف Secrets، ولا يشغل Backup أو Restore، ولا يغير Branch Protection، ولا ينشر Production، ولا يحسم مزود الاستضافة أو قاعدة البيانات.
