# ابدأ من هنا — وكلاء Fleet Commander

## رابط المستودع
https://github.com/mosabosama2030-oss/Fleet-commander-

**تعليمات الفريق مدمجة في `main` عبر PR #12 (2026-11-14).** ابدأ من الفرع الافتراضي؛ لا تحتاج إلى فرع التجهيز القديم لقراءة التعليمات.
- PR #12: https://github.com/mosabosama2030-oss/Fleet-commander-/pull/12
- حالة التشغيل والتكامل: `docs/agents/GITHUB_AUTOMATION_STATUS_AR.md`
- فهرس المهام: `docs/agents/AGENT_TASK_INDEX_AR.md`
- رسائل بدء الحسابات: `docs/agents/ONE_TIME_AGENT_LAUNCH_MESSAGES_AR.md`

## عند دخولك أول مرة
1. استخدم Role ID الذي عيّنه MOSAAB: CHATGPT-1 أو CHATGPT-2 أو CLAUDE-1 أو CLAUDE-2 أو GROK-1 أو GROK-2 أو MANUS-1 أو MANUS-2 أو META-DESIGN. لا تخمّن دورك.
2. اقرأ `AGENTS.md` وملف مزودك إن وجد: `CLAUDE.md` أو `GROK.md` أو `MANUS.md`. ChatGPT/Codex يتبع `AGENTS.md`.
3. اقرأ `docs/agents/TEAM_OPERATING_MODEL_AR.md` و`docs/agents/AGENT_TASK_INDEX_AR.md`.
4. افتح Issue المخصص لدورك فقط (#2 إلى #10). تحقق أنه ما زال مفتوحًا ولم يطالب به وكيل آخر.
5. افحص الحالة الحية على GitHub: main، PRs، Issues، الفروع، وآخر SHA.
6. اكتب CLAIM على Issue قبل أي تعديل، وحدد Base SHA والفرع والمسارات.
7. PR #1 مدمج بالفعل في `main` منذ 2026-11-19؛ لا تتعامل معه كفرع غير مدمج أو كطلب Draft. قارن `main` فقط بالفروع المفتوحة ذات الصلة، ولا تعتبر أي قرار في فرع غير مدمج معتمدًا تلقائيًا.
8. نفذ ما تسمح به المهمة والبوابات، ثم افتح PR مستقلًا واكتب تسليمًا يتضمن الاختبارات الفعلية والـNext Agent Role/Issue.

## قرارات وحدود
A0 لها قرارات موثقة وقرارات أخرى مفتوحة. اقرأ سجل القرارات الأحدث. لا تخترع قواعد مالية أو عملة أو احتفاظ GPS أو تقنية استضافة لم تعتمد بعد. لا تبدأ كودًا يعتمد على قرار P0 مفتوح.

## الاستقلالية والتسليم
Issues وملفات التعليمات تنظم التكليف ولا تشغّل نموذج AI بمجرد فتح المستودع. تعليق HANDOFF لا يوقظ حسابًا آخر تلقائيًا. لا تدّعِ تشغيلًا ذاتيًا بين المزودين قبل وجود Dispatcher/Runtime واختبار event-to-agent-to-handoff ناجح.

## قواعد المدير البشري
MOSAAB وحده يعتمد قرارات المنتج وإغلاق المراحل ودمج PRs والنشر والأسرار والتكاليف. PR #1 وPR #12 مدمجان بالفعل؛ لا تحاول إعادة دمجهما، ولا تدمج أي PR آخر نيابةً عنه. لا تنشر إلى الإنتاج.
