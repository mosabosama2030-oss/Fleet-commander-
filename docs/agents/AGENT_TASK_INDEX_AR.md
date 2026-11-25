# فهرس تكليفات وكلاء Fleet Commander

- المستودع: https://github.com/mosabosama2030-oss/Fleet-commander-
- الفرع الافتراضي ومصدر الحقيقة للنسخة المعتمدة: `main`.
- تعليمات التشغيل الأساسية مدمجة في `main` عبر PR #12؛ راجع `AGENTS.md` و`docs/agents/TEAM_OPERATING_MODEL_AR.md`.
- دليل الدخول: `docs/agents/START_HERE_AR.md`.
- لوحة حالة التنفيذ الحية: `docs/agents/TASK_EXECUTION_BOARD_AR.md`.
- مسار Copilot الاحتياطي: `docs/agents/FREE_GITHUB_AGENT_EXECUTION_AR.md`؛ مصدره PR #16 وما زال غير مدمج.
- تقرير خط الأساس والتعارضات الخاص بـFC-001: `docs/agents/BASELINE_AUDIT_AR.md` على فرع `agent/CHATGPT-1/FC-001` ضمن PR #22.

## 1. ملكية المهام الحالية

هذه اللقطة مطابقة مع بيانات GitHub بتاريخ 2026-11-16. Role IDs هويات تشغيلية وليست GitHub usernames؛ لا توجد GitHub assignees مؤكدة لهذه الأدوار، ولا يجوز افتراض @mentions أو صلاحيات مزودي AI.

| Role ID | الحساب / المنصة | Issue | المهمة والملكية الحالية | دليل GitHub / المخرج |
|---|---|---:|---|---|
| CHATGPT-1 | ChatGPT الأول | [#2](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/2) | Engineering Coordination؛ مالك تحديث baseline والفهرس | CLAIM قائم؛ PR [#22](https://github.com/mosabosama2030-oss/Fleet-commander-/pull/22) OPEN / DRAFT؛ يضم baseline وتحديث هذا الفهرس |
| CHATGPT-2 | ChatGPT الثاني | [#3](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/3) | مراجعة مستقلة للأمان والخصوصية وجودة A0 | Issue OPEN؛ لم يظهر CLAIM أو PR في المطابقة |
| CLAUDE-1 | Claude الأول | [#4](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/4) | خيارات Backend / DB / Hosting وADR مقترح | CLAIM وتسليم موجودان؛ PR [#13](https://github.com/mosabosama2030-oss/Fleet-commander-/pull/13) OPEN / NOT DRAFT؛ لا اعتماد بشري للقرار التقني |
| CLAUDE-2 | Claude الثاني | — | لا توجد مهمة نشطة حاليًا بعد إعادة إسناد FC-004 من CLAUDE-2 إلى MANUS-1 بتوجيه MOSAAB | لا يطالب بـIssue #5؛ ينتظر تكليفًا جديدًا |
| MANUS-1 | Manus الأول | [#5](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/5) | مالك FC-004 الحالي بتوجيه MOSAAB؛ مواصفة Web/PWA UX | CLAIM وإعادة الإسناد موثقان؛ PR [#20](https://github.com/mosabosama2030-oss/Fleet-commander-/pull/20) OPEN / NOT DRAFT |
| GROK-1 | Grok الأول | [#6](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/6) | مراجعة الاتساق المعماري وتعارضات الفروع | CLAIM وتسليم READY_FOR_REVIEW؛ تعليق Issue #6 يربط PR [#21](https://github.com/mosabosama2030-oss/Fleet-commander-/pull/21) صراحةً؛ PR OPEN / NOT DRAFT |
| GROK-2 | Grok الثاني | [#7](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/7) | استراتيجية الاختبار وربط المتطلبات بالأدلة | CLAIM وتسليم READY_FOR_REVIEW؛ الفرع `agent/GROK-2/FC-006` يحتوي `docs/testing/TEST_EXECUTION_BLUEPRINT_AR.md`؛ لم يظهر PR مقدم |
| MANUS-1 | Manus الأول — تسليم سابق | [#8](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/8) | رحلة Captain وفجوات سير العمل | المخرج سُلّم في PR [#15](https://github.com/mosabosama2030-oss/Fleet-commander-/pull/15) OPEN / DRAFT؛ تعليق التسليم يوجه المراجعة التالية إلى MOSAAB، وليس عملًا تنفيذيًا نشطًا موازيًا لـ#5 |
| MANUS-2 | Manus الثاني | [#9](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/9) | CI والتشغيل والقبول والإصدار | CLAIM وتسليم موجودان؛ PR [#19](https://github.com/mosabosama2030-oss/Fleet-commander-/pull/19) OPEN / DRAFT |
| META-DESIGN | Meta AI | [#10](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/10) | الاتجاه البصري ونظام التصميم ومخرجات مرئية RTL | Issue OPEN؛ لم يظهر CLAIM أو تسليم GitHub في المطابقة |
| MOSAAB | Human Director | [#11](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/11) | ربط الهويات والصلاحيات، الحماية، وتفعيل Agent Runtime | HUMAN_CONTROLLED؛ تبقى قرارات الاعتماد والتفعيل والدمج والنشر له وحده |
| CLAUDE-1 | Claude الأول | [#17](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/17) | FC-011 — شريحة Backend A المحلية | CLAIM وتسليم READY_FOR_REVIEW؛ PR [#18](https://github.com/mosabosama2030-oss/Fleet-commander-/pull/18) OPEN / DRAFT؛ لا HTTP أو قاعدة بيانات، وDEC-03 تحجب الحساب المالي |

### قاعدة عدم ازدواج التنفيذ

- MANUS-1 لديه تسليم سابق لـ#8 في PR #15 ينتظر مراجعة MOSAAB، ثم أعاد MOSAAB إسناد #5 إليه عبر PR #20. لذلك #8 ليست مطالبة تنفيذ جديدة متزامنة؛ أي استئناف لها يتطلب توجيهًا جديدًا.
- لا يتولى CLAUDE-2 Issue #5 بعد إعادة الإسناد.
- لا يُعلن PR #13 جاهزًا للدمج لمجرد أنه OPEN / NOT DRAFT؛ حالة المسودة ليست موافقة مراجعة.
- ارتباط PR #21 بـIssue #6 مثبت بتعليق Issue #6، مع بقاء نص خانة Closes في جسم PR غير مكتمل؛ لا تعِد كتابة الربط على أنه Closes #6 دون تحديث PR.
- وجود فرع Issue #7 لا يعني أن PR قد أُنشئ؛ المطلوب تسليم PR إذا كان هذا ضمن توجيه GROK-2.

## 2. قواعد التكليف والتنفيذ

1. Issue واحدة = مالك تنفيذي واحد. لا يبدأ وكيل عملًا على Issue عليها CLAIM نشط أو فرع عامل أو PR مفتوح.
2. قبل التنفيذ، يسجل المنفذ CLAIM على Issue يتضمن Role ID وBase SHA والفرع والمسارات المخطط تعديلها.
3. الفرع القياسي: `agent/<role-id>/FC-00N`، والعمل عبر فرع وPR فقط؛ لا كتابة مباشرة على `main`.
4. قبل تعديل أي ملف، افحص PRs المفتوحة والفروع ومالك الملف. الملف المتداخل لا يعدّل بالتوازي؛ اتفق على تحريره أو نقل الملكية أولًا.
5. التسليم يذكر STATUS وBASE SHA وHEAD SHA وCHANGED PATHS وأوامر الاختبار ونتائجها الفعلية وRISKS/UNKNOWN وPR LINK وNEXT ROLE/NEXT ISSUE.
6. READY_FOR_REVIEW لا يعني FIXED_AND_TESTED، ووجود ملف أو PR لا يعني DONE.
7. ذكر NEXT ROLE أو إضافة HANDOFF لا يوقظ جلسة المزود التالية تلقائيًا.

## 3. مصدر الحقيقة وترتيب المراحل

- `main` هو مصدر الحقيقة لما تم دمجه واعتماده في المستودع.
- `session/05-tech-auth-gps` فرع غير مدمج ومتباعد عن main (23 commit ahead / 20 behind في المطابقة المرجعية بتاريخ 2026-11-16). وثائقه مرجع للتحليل فقط ولا تنتقل قراراته إلى main تلقائيًا.
- PR #1 ما زال OPEN / NOT DRAFT في GitHub، رغم أن نص المهمة السابق طلب إبقاءه OPEN / DRAFT. لم يتم تغيير حالته؛ MOSAAB يقرر تصحيحها ومراجعة محتواه.
- ترتيب الاعتماد: A0 → G0 → A1 → G1 → A2 → D1 وفق حدود التفويض البشري المسجل؛ لا تُحوّل وثائق الفروع أو PRs Draft إلى قرارات معتمدة.
- قرارات A0 المفتوحة ذات الأثر المباشر تشمل DEC-03 (أمثلة الشيفت وقواعد الحساب)، DEC-05 (تصنيفات المصروفات)، DEC-09 (العملة والتقريب)، DEC-08 (Backend/DB/Hosting)، وDEC-10 (الاحتفاظ بالموقع وفترة العينات). DEC-11 لمزود الخرائط مؤجل.
- لا ينفذ أي وكيل قواعد مالية أو قرار منتج أو انتقال بوابة دون دليل اعتماد MOSAAB.

## 4. منفذ GitHub Copilot الاحتياطي

- PR [#16](https://github.com/mosabosama2030-oss/Fleet-commander-/pull/16) ما زال OPEN / DRAFT، ويضيف مسار GitHub Agentic Workflows باستخدام GitHub Copilot فقط.
- تم تحرير `docs/agents/AGENT_TASK_INDEX_AR.md` من PR #16 وإعادته إلى محتوى main؛ أصبح CHATGPT-1 / FC-001 مالك تحديث هذا الفهرس.
- آخر تحقق من PR #16: الفرع لا يتضمن أي تغيير على ملف الفهرس. تشغيل GitHub Actions #43954017874 نجح لتثبيت gh-aw وstrict compile والتحقق من المصدر بعد التحديثات المسجلة؛ هذا لا يثبت end-to-end `/fc-run`.
- لا يستخدم `/fc-run` قبل دمج PR المصدر وملف lock وإعداد المتطلبات البشرية/السرية اللازمة. لا يوقظ هذا المسار حسابات ChatGPT أو Claude أو Grok أو Manus؛ إنه منفذ Copilot احتياطي واحد.
- إذا اكتشف CLAIM أو فرع عمل أو PR قائمًا، يتوقف المنفذ الاحتياطي لمنع تكرار المهمة.

## 5. حالة الحماية والبوابة البشرية

- GitHub branch metadata أعاد `main.protected=true` و`protection.enabled=true`، وRepository Rulesets أعاد `[]`.
- metadata المعادة لا تتضمن Required Status Check contexts أو checks مسجلة.
- GitHub سبق أن رفض دمج PR #22 ما لم توجد موافقة واحدة على الأقل من reviewer لديه write access. تفاصيل إعداد Branch Protection الكلاسيكية الكاملة لم تكن متاحة عبر موصل GitHub في الفحص.
- Issue #11 هي بوابة بشرية منفصلة؛ لا تعتبر ربط الوكلاء أو الحماية أو Runtime مفعلًا دون اختبار موثق.

## 6. ضوابط Human Director

- MOSAAB وحده يوافق على قرارات المنتج والانتقال بين البوابات ودمج PRs وإغلاق المراحل والنشر.
- لا merge أو force-push أو حذف موارد أو أسرار أو إعدادات إنتاج أو خدمات مدفوعة دون إذن صريح منفصل.
- يجب أن تظل الحالات والنتائج مصنفة بصدق: VERIFIED / INFERRED / PROPOSED / UNKNOWN، والتنفيذ FIXED_AND_TESTED / PARTIAL / NOT_RUN / NOT_REQUIRED.
