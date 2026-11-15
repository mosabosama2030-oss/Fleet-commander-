# فهرس تكليفات وكلاء Fleet Commander

- المستودع: https://github.com/mosabosama2030-oss/Fleet-commander-
- تعليمات الفريق مدمجة في main عبر PR #12.
- دليل الدخول: docs/agents/START_HERE_AR.md.
- لوحة حالة المهام: docs/agents/TASK_EXECUTION_BOARD_AR.md.
- مسار التنفيذ المجاني من GitHub: docs/agents/FREE_GITHUB_AGENT_EXECUTION_AR.md.

## الحسابات والمهام

| Role ID | الحساب/المنصة | Issue | المهمة | المخرج |
|---|---|---:|---|---|
| CHATGPT-1 | ChatGPT الأول | #2 | تنسيق خط الأساس وفهرس المهام | Baseline audit + task index |
| CHATGPT-2 | ChatGPT الثاني | #3 | مراجعة مستقلة للأمان وجودة A0 | Security/QA review |
| CLAUDE-1 | Claude الأول | #4 | خيارات Backend/DB/Hosting | Technical decision matrix |
| CLAUDE-2 | Claude الثاني | #5 | Web/PWA وتجربة الاستخدام | UX implementation spec |
| GROK-1 | Grok الأول | #6 | المعمارية وتعارضات الفروع | Architecture consistency review |
| GROK-2 | Grok الثاني | #7 | الاختبارات والتتبع | Test execution blueprint |
| MANUS-1 | Manus الأول | #8 | رحلة Captain والقرارات المفتوحة | Workflow gap report |
| MANUS-2 | Manus الثاني | #9 | CI والتشغيل والإصدار | Operations/release plan |
| META-DESIGN | Meta AI | #10 | الاتجاه البصري ونظام التصميم | Visual design package |

## قواعد إسناد المهمة

- Role IDs هويات تشغيلية وليست GitHub usernames. لا تستخدم assignee أو @mention لحساب مزود AI قبل معرفة هوية GitHub وصلاحياتها فعليًا.
- Issue واحد = مالك واحد. لا يبدأ وكيل عملًا على Issue عليه CLAIM نشط أو فرع عمل أو PR مفتوح.
- قبل التنفيذ يكتب المنفذ CLAIM في Issue، ويحدد Base SHA والفرع والمسارات.
- كل تغيير عبر فرع مستقل وPR. لا عمل مباشر على main.
- التسليم يتضمن HEAD SHA وFILES وTESTS + ACTUAL RESULTS وRISKS/UNKNOWN وNEXT ROLE/NEXT ISSUE.
- ذكر NEXT ROLE لا يشغّل الحساب التالي تلقائيًا. الانتقال الفعلي يتطلب جلسة مزود أو Runtime مدعومًا.
- لا يدّعي الوكيل هوية مزود آخر. منفذ Copilot الموثق في هذا المشروع هو منفذ احتياطي واحد عبر GitHub، وليس حسابات ChatGPT/Claude/Grok/Manus.

## التشغيل من داخل GitHub

بعد دمج PR إضافة GitHub Agentic Workflow، ثم دمج PR ملف lock المولّد، وإعداد COPILOT_GITHUB_TOKEN بالحصة المجانية:
1. افتح Issue من #2 إلى #9.
2. علّق /fc-run.
3. سيعمل GitHub Copilot فقط إذا كانت الحصة المجانية والمصادقة صالحتين.
4. ينشئ المنفذ Draft PR واحدًا بحد أقصى، ولا يغلق Issue أو يدمج PR.
5. إذا اكتشف Claim/branch/PR قائمًا، يتوقف لتفادي التعارض.

هذا المسار لا يستدعي حسابات ChatGPT/Claude/Grok/Manus ولا Meta AI. Issue #10 المرئي يُنفّذ عبر Meta AI، ولا يستبدله منفذ النص.

## أولويات A0

الوثائق الأحدث على session/05-tech-auth-gps تشير إلى قرارات تحتاج مراجعة وحسمًا بشريًا قبل اعتماد أي تنفيذ يعتمد عليها، ومنها:
- DEC-03: أمثلة الشيفت وقواعد الحساب.
- DEC-05: تصنيفات المصروفات.
- DEC-09: العملة والتقريب.
- DEC-08: Backend وقاعدة البيانات والاستضافة.
- DEC-10: الاحتفاظ بالموقع وفترة العينات.
- DEC-11: مزود الخرائط مؤجل.

تحقق من SHA وسجل القرارات قبل اتخاذ أي قرار. لا تعتبر فرع session أو PR Draft موافقًا عليه تلقائيًا.

## بوابة بشرية

FC-010 / Issue #11 تخص MOSAAB وحده: ربط الهويات والصلاحيات، إعداد Agent Runtime، التحقق من branch protection، واعتماد التكلفة/السرية. لا تغلق هذه المهمة بادعاء غير مختبر.

## معيار التقدم

لا يعلن أي دور DONE بسبب كتابة مستند فقط. يجب أن يكون مخرج المهمة مرتبطًا بمعايير قبول، مع أدلة ومراجعة مستقلة ونتائج اختبار صادقة. MOSAAB وحده يعتمد قرارات المنتج والانتقال بين البوابات والدمج والنشر.
