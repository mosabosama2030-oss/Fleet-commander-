# حالة تجهيز GitHub والتشغيل الذاتي

## VERIFIED — ما تم فحصه
- المستودع: `mosabosama2030-oss/Fleet-commander-`.
- الفرع الافتراضي: `main`.
- SHA الحالي لـmain عند بدء التجهيز: `6cebb40136f11027ec7e5e3c50f62a813a03938f`.
- الفروع التي ظهرت في الفحص كانت غير محمية؛ خاصية `protected=false` لفروع main والفروع المسجلة.
- استعلام Repository Rulesets أعاد قائمة فارغة `[]`؛ لا توجد Rulesets على المستودع وقت الفحص.
- PR #1 مفتوح وبحالة Draft، وليس مدمجًا.
- `session/05-tech-auth-gps` كان 23 commit ahead و0 behind من main وقت الفحص.
- Issues #2..#10 أنشئت كتكليفات أولية للأدوار التسعة.
- أضيفت تعليمات الوكلاء وقوالب PR وIssue على فرع التجهيز، ولم تُدمج في main.
- شجرة main وقت الفحص لم تعرض مجلد `.github/workflows/`؛ لم يثبت وجود GitHub Actions workflow في main.
- GitHub integration المتاح هنا أنشأ فروعًا وملفات وIssues؛ لا يوفر في هذا المسار أداة كتابة Branch Protection/Rulesets أو إضافة GitHub App/provider credentials.

## NOT CONFIGURED — ما لم يُفعّل بعد
- لا يوجد ربط موثق لحسابات ChatGPT/Claude/Grok/Manus التسعة بهويات GitHub منفصلة أو صلاحيات مراجعة/كتابة متحققة.
- Issues لا تحتوي assignees؛ أسماء الأدوار ليست GitHub usernames.
- لم تُفعّل Branch Protection أو Rulesets أو required checks.
- لم يُنشأ أو يُفعّل GitHub Project board.
- لم تُنشأ GitHub Actions لتشغيل وكلاء LLM خارجيين.
- لا توجد provider API keys أو webhook endpoints أو runner credentials موثقة.
- لم يتم اختبار أي تشغيل تلقائي من حدث issue/PR إلى Claude/Grok/Manus/ChatGPT.
- لا توجد آلية حقيقية لإيقاظ الوكيل التالي تلقائيًا بعد handoff.

## القيد الحاسم
GitHub Issues وملفات AGENTS/CLAUDE/GROK/MANUS تنظّم التكليف وتوفر سياقًا للوكيل عند فتحه؛ لكنها لا تشغّل نموذج AI بمجرد زيارة المستودع ولا ترسل جلسة من مزود إلى آخر. التشغيل المتواصل unattended يحتاج Agent Runtime لكل مزود أو مشغل مركزي يستدعي APIs المصرح بها، مع أسرار محفوظة في GitHub Secrets/Environment، وحدود ميزانية وتزامن، وتدقيق، ومفتاح إيقاف. لم يتم اختراع هذه الاتصالات أو تفعيل أسرارها.

## ما يمكن فعله الآن
عندما توجّه كل حساب إلى المستودع بالرسالة المحددة في ONE_TIME_AGENT_LAUNCH_MESSAGES_AR.md، يقرأ ملف التعليمات ويبدأ Issue الخاص به داخل جلسته، ثم يسلّم بالـPR والتعليق للوكيل التالي. هذا تشغيل ذاتي داخل الجلسة وليس تشغيلًا دائمًا في الخلفية.

## متطلبات المرحلة التالية للتشغيل الآلي الحقيقي
1. ربط كل حساب/Agent Runtime بالمستودع بأقل صلاحيات ممكنة.
2. تحديد هوية GitHub لكل حساب أو استخدام GitHub App مخصص مع صلاحيات Contents/Issues/PRs الضرورية فقط.
3. اعتماد مشغل مركزي/Provider webhooks لتلقي Issue events وhandoff events.
4. تخزين أسرار المزودين في GitHub Environments/Secrets بعد موافقة MOSAAB؛ لا تضعها في الملفات.
5. إنشاء dispatcher يمنع مطالبة وكيلين بالمهمة نفسها باستخدام claim/lease وidempotency.
6. تحديد limits للتكلفة والوقت وإعادة المحاولة والتزامن ومفتاح kill switch.
7. إبقاء مراجعة البشر والدمج والنشر تحت سلطة MOSAAB.

## إجراء إداري مطلوب من Human Director
فعّل من إعدادات GitHub حماية `main`: منع force push والحذف، طلب PR، وإلزام مراجعة بشرية مستقلة ونجاح CI بعد إضافة checks حقيقية. لا تضع Required Checks غير موجودة حتى لا تحجب الدمج. يجب التحقق من الحالة بعد التفعيل.
