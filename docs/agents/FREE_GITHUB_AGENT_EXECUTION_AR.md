# تشغيل مهام Fleet Commander من داخل GitHub — المسار المجاني

آخر تحديث: 2026-11-15.
الهدف: تشغيل مهمة محددة من داخل GitHub Issue، مع إبقاء الدمج والقرارات والنشر تحت سلطة MOSAAB.

## ما يقدمه هذا المسار

- GitHub Actions على المستودع العام لتشغيل خطوات التنسيق والتحقق. تشغيل الـ standard runners في المستودعات العامة مجاني وفق وثائق GitHub.
- GitHub Agentic Workflows (gh-aw) مفتوح المصدر ومجاني كإطار تشغيل. في هذا المستودع، GitHub Actions القياسي يُستخدم على مستودع عام.
- محرك التنفيذ الوحيد في هذا المسار هو GitHub Copilot CLI من خلال gh-aw. صفحة الخطط الرسمية تؤكد أن Free بقيمة $0 يشمل CLI وAgent mode بحد استخدام محدود، ولا يشمل Copilot cloud coding agent الذي يُسند إليه Issue/PR لإنشاء PR مستقل. مسارنا يستخدم محرك CLI داخل Actions، وليس ميزة cloud coding agent.
- سقف هذا الـworkflow مضبوط على 50 AIC و8 turns لكل تشغيل، مع تشغيل إداري يدوي فقط ومعدل تشغيل أقصى واحد لكل ساعة. إذا لم تتوفر الحصة أو انتهت، يتوقف التنفيذ؛ لا ننتقل إلى API مدفوع ولا نفعّل ترقية أو شراء رصيد.

## قيد مهم: الحساب الشخصي والمصادقة

المستودع مملوك لحساب شخصي، وليس مؤسسة GitHub. لذلك يستخدم gh-aw في هذا السياق Fine-grained PAT باسم السر:

COPILOT_GITHUB_TOKEN

إعداد الرمز المطلوب حسب وثائق GitHub Agentic Workflows:
1. أنشئ Fine-grained personal access token من حسابك الشخصي.
2. اجعل Account permissions → Copilot Requests = Read.
3. لا تمنحه صلاحيات Repository غير مطلوبة لهذا الغرض.
4. أضف الرمز من GitHub → Settings → Secrets and variables → Actions → New repository secret، بالاسم COPILOT_GITHUB_TOKEN.
5. لا ترسله في المحادثات أو Issues ولا تضعه داخل Git.

هذا الرمز لا يشتري API credits؛ لكنه يستخدم أهلية Copilot والحصة المجانية المحدودة للحساب. Free لا يتضمن Flex allotment أو شراء أرصدة إضافية وفق صفحة الخطط وقت الفحص. لا تفعّل Copilot Pro ولا أي overage أو شراء رصيد. إذا انتهت الحصة المجانية، يتوقف الاستدعاء حتى التجديد أو التوافر؛ لا يسمح هذا المشروع بالترقية أو الدفع.

## طريقة تشغيل مهمة

بعد دمج مصدر workflow وملف lock المولّد:
1. افتح Issue المطلوب من #2 إلى #9.
2. أضف تعليقًا مستقلًا يحتوي فقط على /fc-run.
3. يجب أن يكون المشغّل صاحب صلاحية admin.
4. سيقرأ الـAgent ملف AGENTS.md وفهرس المهام وIssue وسجل التعليقات والفروع وPRs.
5. إذا وجد Claim نشطًا أو فرعًا له عمل أو PR قائمًا، فلن يكرر العمل؛ سيكتب تقرير حالة فقط.
6. إن كانت المهمة غير مطالَب بها، ينفّذ أصغر نطاق مناسب ويُنشئ Draft PR واحدًا كحد أقصى، ويكتب الاختبارات ونتائجها الفعلية.
7. لا يغلق Issue ولا يدمج PR ولا ينشر إلى الإنتاج.
8. يكتب NEXT_AGENT_ROLE وNEXT_ISSUE كتسليم. هذا التسليم لا يشغّل حساب المزود التالي تلقائيًا.

Issue #10 يخص META-DESIGN وإنتاج الاتجاهات/الأصول المرئية؛ لا تستخدم Copilot النصي بديلاً عن Meta AI في إنتاج مرئي. Issue #11 بوابة بشرية ولا تشغّلها بهذا الأمر.

## ما لا يفعله هذا المسار

- لا يوقظ حسابي ChatGPT ولا Claude ولا Grok ولا Manus ولا Meta AI.
- لا يستهلك اشتراك هؤلاء المزودين ولا يربط API خاصًا بهم.
- لا يضمن إكمال كل Issue تلقائيًا أو انتقال المهام بين مزودين مستقلين.
- لا يغيّر إعدادات Actions أو الأسرار أو الحماية ولا يدمج أي PR.

الربط الفعلي بحسابات ChatGPT/Claude/Grok/Manus يظل عبر جلسات كل مزود أو خدمة تشغيل معتمدة لديه. لا يوجد دليل أن GitHub App أو إضافة repo access وحدها تستطيع إيقاظ جلسات تلك الحسابات من دون runtime/API لذلك المزود.

## تسلسل التهيئة

- PR الخاص بالمصدر يضيف .github/workflows/fc-agent.md وملف compile workflow.
- عند دمجه، يتحقق GitHub Actions من صيغة المصدر. على حدث push إلى main، يحاول تجميع ملف lock ويفتح PR للمراجعة يحتوي الملف المولّد فقط.
- يراجع MOSAAB PR ملف lock ويدمجه بنفسه.
- يُضاف secret COPILOT_GITHUB_TOKEN يدويًا وبشكل آمن.
- بعد تفعيل Actions ووجود السر، يُجرّب /fc-run على Issue واحدة غير مطالَب بها أولاً. لا تشغّل عدة مهام قبل فحص أول نتيجة.

## حالات التحقق

- GitHub Actions workflow source: مضاف على فرع PR #16.
- gh-aw v1.2.2 installation + checksum verification: PASS في تشغيل 43675869609 و43675985729.
- gh-aw strict compile `gh aw compile fc-agent --validate --strict`: PASS في التشغيلين؛ تم توليد lock وفحص وجوده داخل runner.
- أول تشغيل 43675705652 فشل في طريقة تثبيت الإضافة القديمة؛ تم إصلاح الخطوة ولا يُخفى هذا الفشل التاريخي.
- ميزة user-rate-limit تعمل مع تحذير compile بأنها experimental في إصدار gh-aw v1.2.2.
- Copilot authentication/secret: NOT_CONFIGURED من خلال الأدوات المتاحة؛ لا أملك قراءة الأسرار ولا أطلب كشفها.
- End-to-end issue → Copilot → Draft PR: NOT_RUN؛ يحتاج دمج مصدر PR #16، ثم lock PR الناتج، ثم إعداد COPILOT_GITHUB_TOKEN.
