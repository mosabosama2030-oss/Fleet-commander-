# تقرير الاستلام والاستكمال عبر Termux — Fleet Commander

آخر تحديث: 2026-11-20 (Africa/Cairo)
المستودع: https://github.com/mosabosama2030-oss/Fleet-commander-
المالك البشري وصاحب قرارات الدمج والنشر: MOSAAB

## 1. الملخص التنفيذي

Fleet Commander هو مساعد تشغيل وذكاء شخصي للكابتن الفردي، وليس سوقًا لمطابقة الركاب والسائقين. النطاق المثبت: Captain فردي، Web + Android، Online-only.

**VERIFIED:** يوجد الآن هيكل واجهة عربية RTL، ونواة TypeScript للمجال، ومساعد صوتي قواعدي مقترح، وLLM Gateway اختياري مغلق افتراضيًا، وGitHub Actions مجانية لفحوص Backend والواجهة. الواجهة لم تتصل بعد بـAPI أو قاعدة بيانات، ولا يوجد نشر إنتاجي موثق.

**VERIFIED:** آخر `main` وقت إعداد هذا التقرير هو `8ba4511629cb6f64e21ce9a7537c034cf77a9660`، ويتضمن دمج PR #18. الشيفرة الأحدث على main ما زالت بلا Fastify HTTP server أو PostgreSQL أو تسجيل دخول فعلي.

**VERIFIED:** PR #32 مفتوح بحالة Draft وقابل للدمج تقنيًا؛ لم يدمج. يضيف Manifest وأيقونات لتجهيز PWA فقط. تشغيل CI على PR #32 نجح في run #44626360179، وrun الدفع #44626198558 نجح أيضًا.

## 2. ما تم إنجازه — أدلة وحالة

### 2.1 الأساس والحوكمة
- **VERIFIED:** PR #12 أضاف نظام تعليمات وتشغيل الوكلاء ودمج.
- **VERIFIED:** PRs #1 و#13 و#15 و#18 و#19 و#20 و#21 و#22 و#23 وغيرها من أعمال A0 والمعمارية والـBackend التي ظهرت كسابقة في سجل المستودع؛ راجع الحالة الحية على GitHub قبل اعتبار أي مخرج جديدًا أو غير مدمج.
- **VERIFIED:** سياسة المستودع تمنع الوكلاء من الدمج والنشر والإفصاح عن أسرار. MOSAAB وحده صاحب القرار النهائي.
- **UNKNOWN:** تفاصيل Branch Protection الحالية يجب فحصها من GitHub Settings مباشرة؛ محاولة تعديلها سابقًا واجهت تحقق Sudo ولم يثبت أن التغييرات حُفظت. لا تعتمد على نص قديم داخل ملفات التعليمات لتمثيل الحالة الحالية.

### 2.2 Backend
الملفات الرئيسة في main:
- `backend/src/domain/fleet-service.ts`
- `backend/src/domain/types.ts`
- `backend/src/http/wire.ts`
- `backend/src/voice/`
- `backend/src/ai/`
- `backend/test/`

المتاح:
- حالات الشيفت والرحلة والمركبة.
- تسجيل الرحلة وإبطالها والتصحيح الإلحاقي append-only.
- مفاتيح idempotency موحدة وقوائم pagination.
- تحويلات wire نقية للأخطاء والترويسات والصفحات.
- محرك صوت قواعدي لفهم صيغ عربية/مصرية/إنجليزية مع تأكيد قبل التنفيذ.
- LLM Gateway بعقود وتنقيح وميزانية وقاطع دائرة، لكنه **معطل افتراضيًا ولا يوجد provider حقيقي**.

**VERIFIED — CI:** تشغيل Backend CI رقم #44618435453 نجح على Node 22.18.0 وNode 24، وشمل اختبارات Backend وTypeScript typecheck. سجل جلسة Claude على main يذكر 147 اختبارًا ناجحًا و0 فشل؛ اعتبر النتيجة الأوثق للنسخة المدمجة هي تشغيل GitHub Actions الذي يجب فتحه للتحقق من رأس الـcommit الجاري.

المفقود:
- Fastify HTTP server حقيقي.
- مصادقة بريد/كلمة مرور وجلسات.
- تفويض وعزل ملكية بيانات كل كابتن في طبقة HTTP.
- تخزين دائم وPostgreSQL.
- تكامل فعلي بين API والواجهة والصوت.
- اختبارات API/integration/auth/persistence/concurrency.

### 2.3 Web/PWA
الملفات الرئيسة:
- `web/index.html`
- `web/styles.css`
- `web/app.js`
- `web/test_web.py`
- `web/manifest.webmanifest` و`web/icons/` (على PR #32 فقط حتى يدمج).

**VERIFIED:** واجهة عرض عربية RTL بستة أقسام: الرئيسية، الشيفت، الرحلات، المصروفات، التقارير، الإعدادات. التنقل يعمل وفق اختبارات الهيكل؛ المؤشر الظاهر يقيس اتصال الجهاز لا اتصال الخادم. الواجهة لا تحفظ البيانات ولا تنفذ طلبات API أو GPS أو عمليات مالية.

**VERIFIED:** PR #32 يضيف manifest محليًا بثلاث أيقونات (192×192 و512×512 وmaskable 512×512). فحص GitHub Actions نجح:
- Run #44626198558 (push): SUCCESS.
- Run #44626360179 (pull_request): SUCCESS.
- `node --check web/app.js`: PASS.
- `python -m unittest discover -s web -p 'test_*.py' -v`: 11 tests, OK.

**NOT RUN:** استضافة HTTPS، ظهور Install prompt، التثبيت والتشغيل standalone على جهاز Android حقيقي، فحص بصري/إتاحة على جهاز حقيقي.

### 2.4 الاختبارات وCI المجاني
- `.github/workflows/backend-ci.yml`: Backend tests + typecheck.
- `.github/workflows/web-ci.yml`: JavaScript syntax + Python unittest.
- الصلاحيات workflow محدودة إلى `contents: read` في هذين الـworkflow.
- **VERIFIED:** آخر runs المرتبطة بالواجهة وBackend نجحت كما هو موضح أعلاه.
- **UNKNOWN:** GitHub Actions quotas/current account usage غير مفحوصة؛ لا تفعل أي ميزة مدفوعة أو شراء أرصدة. تشغيلات Standard runners للمستودعات العامة تكون مجانية بحسب سياسة GitHub، لكن تحقق دائمًا من أي تغيير في السياسة أو نوع الـrunner.

## 3. ما لم يتم إنجازه

1. لا يوجد HTTP API production-ready.
2. لا توجد قاعدة بيانات دائمة أو persistence بعد restart.
3. لم يتم اختبار مصادقة حقيقية أو عزل tenant/owner عبر HTTP.
4. لا يوجد نشر أو HTTPS hosting أو رابط live مؤكد.
5. PWA ليس تطبيق Android مستقلًا ولا APK؛ هو تجهيز installability metadata فقط.
6. لم يُختبر المساعد الصوتي بميكروفون/نطق حقيقي أو متصفح Android فعلي.
7. لا مزود LLM حقيقي؛ الـGateway مغلق، ولا توجد تكلفة أو API call.
8. لم تعتمد كل قرارات A0/P0، وبالأخص القواعد المالية وتصنيفات المصروفات والعملة والتقريب والاحتفاظ بالموقع وتفاصيل الاستضافة/التخزين.
9. لم تكتمل مراجعة أمنية مستقلة end-to-end.
10. لم يثبت تشغيل تلقائي فعلي بين حسابات ChatGPT/Claude/Grok/Manus لمجرد تثبيت GitHub Apps؛ GitHub Apps توفر وصولًا للمستودع، ولا تثبت إيقاظ جلسات النماذج أو وجود Agent Runtime.

## 4. ما نحتاج عمله بالترتيب

### P0 — حسم القرارات وحماية البيانات
- مراجعة سجل قرارات MOSAAB المعتمد، وتثبيت القرارات المفتوحة مع أصحابها.
- حسم أمثلة الشيفت وقواعد الحساب المالي (DEC-03) قبل أي حساب دخل/صافي.
- حسم تصنيفات المصروفات والعملة/التقريب وبيانات GPS والاحتفاظ بها.
- اعتماد نموذج tenant/owner والتحقق من ملكية كل مورد على الخادم؛ لا تعتمد على tenant_id يرسله المتصفح وحده.
- مراجعة أمنية مستقلة قبل بيانات حقيقية أو نشر.

### P1 — API محلية مجانية
- تنفيذ Fastify فوق النواة الحالية.
- إضافة endpoints للمركبة والشيفت والرحلات والقوائم والتصحيحات، وتوحيد request_id والأخطاء وIdempotency-Key.
- إضافة مصادقة واختبارات صلاحيات وعزل الملكية.
- بناء اختبارات تكامل باستخدام fastify.inject.
- لا تستخدم بيانات شخصية أو مالية حقيقية في الاختبارات.
- لا تضف PostgreSQL قبل اعتماد قرار التخزين. يمكن استخدام adapter مؤقت في الذاكرة للتطوير فقط مع توضيح عدم الاستمرارية.

### P2 — Persistence
- بعد اعتماد DB/hosting، إضافة repository abstraction ومحول PostgreSQL أو خيار محلي معتمد.
- اختبارات كتابة/قراءة/إعادة تشغيل/تزامن/عزل tenant.
- لا تضع بيانات اتصال أو كلمات مرور في Git أو الأوامر النصية.

### P3 — ربط Web/PWA وAndroid
- ربط الواجهة بعقود API بعد اعتمادها؛ لا تعرض نجاح الحفظ قبل رد الخادم.
- تجربة PWA على HTTPS؛ لا تفعّل offline functionality لأن المنتج Online-only.
- قرار مستقل بشأن Android APK/TWA والتوقيع والتوزيع قبل تنفيذها.
- اختبار فعلي على جهاز Android، بما فيه قارئ الشاشة وحالات الاتصال.

### P4 — المساعد والـLLM
- ابدأ بالقواعد المحلية deterministic أولًا.
- لا تشغّل LLM Gateway حتى يعتمد MOSAAB provider وسياسة خصوصية وميزانية.
- أي نموذج يقترح intent فقط؛ لا ينفذ معاملة، ولا يعتمد مبلغًا، ولا يؤكد عملية بدل الكابتن.
- لا API مدفوع؛ أي تجربة free-tier تحتاج مراجعة شروطها وخصوصيتها وحدودها وموافقة منفصلة.

## 5. ما نحتاجه على Termux

### 5.1 أدوات التطوير
- Termux من مصدر موثوق وحديث.
- Git.
- Node.js إصدار 22.18 أو أحدث (استخدم Node 24 إذا كان متاحًا في مستودع Termux ومتوافقًا).
- Python 3.
- محرر نصوص مثل nano أو vim.
- مساحة تخزين كافية وإنترنت Wi-Fi/4G.
- **لا حاجة إلى** Docker أو VPS أو مفاتيح API مدفوعة في مرحلة الاختبار الحالية.

### 5.2 أوامر إعداد Termux

نفّذ الأوامر التالية بالتتابع. لا تلصق أي رمز وصول أو كلمة مرور في ملف أو رسالة.

```bash
pkg update && pkg upgrade
pkg install git nodejs python nano
node --version
npm --version
python --version
git --version
```

إذا كان إصدار Node أقل من 22.18، لا تحاول تخطي فحص إصدار المشروع. حدّث Node من مصدر Termux المتاح أو استخدم بيئة مجانية أخرى معتمدة. لا تضف مستودعات مجهولة أو ملفات APK عشوائية.

### 5.3 استنساخ المستودع

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/mosabosama2030-oss/Fleet-commander-.git
cd Fleet-commander-
git status --short --branch
git switch main
git pull --ff-only origin main
```

إذا كان المستودع موجودًا بالفعل:

```bash
cd ~/projects/Fleet-commander-
git status --short --branch
git switch main
git pull --ff-only origin main
```

إذا ظهرت تغييرات محلية غير محفوظة، لا تستخدم `git reset --hard` ولا تحذفها؛ اعرض `git status` أولًا واحتفظ بها.

### 5.4 فحص PR #32 دون دمج

```bash
git fetch origin pull/32/head:review/pr-32
git log --oneline --decorate -5 review/pr-32
git diff --stat main...review/pr-32
git diff --check main...review/pr-32
git diff main...review/pr-32 -- web/manifest.webmanifest web/index.html web/test_pwa.py
```

لا تدمج محليًا ولا تدفع إلى GitHub. افحص حالة PR وCI من:
https://github.com/mosabosama2030-oss/Fleet-commander-/pull/32

### 5.5 اختبار الواجهة

```bash
cd ~/projects/Fleet-commander-
node --check web/app.js
python -m unittest discover -s web -p 'test_*.py' -v
```

لتجربة الواجهة على الهاتف محليًا داخل المتصفح:

```bash
cd ~/projects/Fleet-commander-/web
python -m http.server 8000 --bind 127.0.0.1
```

افتح على متصفح الهاتف:
`http://127.0.0.1:8000`

هذا اختبار محلي فقط، وليس HTTPS ولا يثبت قابلية تثبيت PWA.

### 5.6 اختبار Backend

```bash
cd ~/projects/Fleet-commander-/backend
node --version
npm test
npm run typecheck
```

قد تحتاج Typescript وNode type definitions. الـCI يثبتها مؤقتًا بإصدارات محددة؛ راجع `.github/workflows/backend-ci.yml`. لا تنشئ package-lock أو تغيّر package.json دون مهمة منفصلة. إذا لم تعمل TypeScript مباشرة في Node على نسختك، سجّل الخطأ وإصدار Node ولا تدّعِ نجاح الاختبار.

### 5.7 قواعد Git الآمنة على الهاتف

```bash
git status --short --branch
git branch --show-current
git log -1 --oneline
git diff --check
```

هذه المهمة لا تتطلب `git push`. لا تنفذ:
- `git push`
- `git push --force`
- `gh pr merge`
- `gh pr ready`
- أي نشر أو رفع APK
إلا بقرار بشري صريح منفصل بعد مراجعة الاختبارات والفرق.

لا تحفظ PAT في سكربت أو ملف إعدادات غير محمي. تجنب وضع الرمز في سطر الأوامر لأنه قد يظهر في history أو سجل العمليات.

## 6. روابط العمل الحالية

- المستودع: https://github.com/mosabosama2030-oss/Fleet-commander-
- main: https://github.com/mosabosama2030-oss/Fleet-commander-/tree/main
- PR #32 — PWA manifest/icons: https://github.com/mosabosama2030-oss/Fleet-commander-/pull/32
- Issue #31 — FC-PWA-01: https://github.com/mosabosama2030-oss/Fleet-commander-/issues/31
- Issue #33 — FC-TERMUX-01: https://github.com/mosabosama2030-oss/Fleet-commander-/issues/33
- PWA CI على PR: https://github.com/mosabosama2030-oss/Fleet-commander-/actions/runs/44626360179
- Backend CI run: https://github.com/mosabosama2030-oss/Fleet-commander-/actions/runs/44618435453

## 7. قرار العمل الحالي

**الخطوة العملية التالية:** افتح Termux، نفذ إعداد الأدوات ثم clone/pull، وشغّل اختبارات الواجهة وBackend. بعد ذلك ابدأ API محلية فقط بفرع مستقل وPR، ولا تبدأ PostgreSQL أو الاستضافة أو LLM provider قبل إغلاق قراراتها.

**مهم:** لا توجد خطوة حالية تتطلب دفع أموال. يمكن إنجاز التطوير والاختبارات المحلية وCI على المستودع العام دون شراء APIs أو VPS أو اشتراكات. أما استضافة HTTPS أو خدمات قواعد البيانات أو حدود free-tier فتحتاج تحققًا وموافقة مستقلة قبل استخدامها.

## 8. سجل الحالات

| العنصر | الحالة |
|---|---|
| Captain + Web/Android + Online-only | VERIFIED |
| Backend domain core | VERIFIED على main |
| Backend CI | SUCCESS في التشغيل المشار إليه |
| Web RTL shell | VERIFIED كواجهة prototype |
| PWA manifest/icons | موجودة في PR #32 فقط، لم تدمج |
| PR #32 tests | SUCCESS |
| HTTP/Fastify API | NOT_RUN / لم تُنفذ |
| Auth/session/owner isolation عبر HTTP | NOT_RUN |
| PostgreSQL/persistence | NOT_RUN |
| HTTPS/live hosting | NOT_RUN |
| Android install test | NOT_RUN |
| LLM provider حقيقي | NOT_CONFIGURED |
| Production deployment | NOT_RUN |
| Paid service | غير مطلوب / لا تستخدم |

