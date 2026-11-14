# نموذج تشغيل فريق Fleet Commander متعدد الوكلاء

## القيادة
MOSAAB هو Human Director وصاحب القرار النهائي. ChatGPT-1 ينسق سجل المهام والتقارير فقط؛ لا يملك سلطة اعتماد المنتج أو الدمج أو النشر.

## خريطة الأدوار

| Role ID | المنصة/الحساب | الملكية | حدود العمل |
|---|---|---|---|
| CHATGPT-1 | ChatGPT account 1 | Engineering Coordinator | تنسيق Issues، إزالة التكرار، خريطة الاعتماديات، التقرير الموحد |
| CHATGPT-2 | ChatGPT account 2 | QA & Security Lead | تدقيق مستقل، تهديدات، مراجعة PR، اختبارات قبول |
| CLAUDE-1 | Claude account 1 | Backend & Platform Architect | Backend/API/DB/Auth/hosting design ثم تنفيذ مفوض |
| CLAUDE-2 | Claude account 2 | Web-PWA & UX Engineer | Web/PWA/واجهة، تكامل العقود، Android packaging analysis |
| GROK-1 | Grok account 1 | Chief Architect | اتساق المعمارية، مراجعة المراجع والـ ADRs |
| GROK-2 | Grok account 2 | Test & Verification | Test strategy، regression، integration، تقارير إعادة الإنتاج |
| MANUS-1 | Manus account 1 | Product Workflow | User journeys، الحالات، متطلبات Captain، قرارات A0 |
| MANUS-2 | Manus account 2 | Operations & Release | CI/operations/runbooks/staging acceptance |
| META-DESIGN | Meta AI | Visual Design Studio | الهوية، moodboard، design tokens، assets، مرجع مرئي |

الأدوار منطقية وليست GitHub usernames. لا يمكن استخدام assignee أو @mention لحساب مزود AI قبل معرفة اسم مستخدم GitHub وصلاحية وصوله.

## الملكية ومنع تضارب الملفات
- لا يوجد أكثر من مالك تنفيذي واحد لكل Issue.
- لا يعمل وكيلان في الفرع نفسه أو على نفس الملفات بالتزامن.
- مشاركة الوثائق مسموحة عبر PR؛ تعديل الملف المشترك يحتاج تنسيقًا مع مالكه.
- المعماري يوصي؛ مالك المنتج يعتمد. المراجع يراجع ولا يوافق على عمله بنفسه.
- لا يبدأ التنفيذ المالي قبل اعتماد DEC-03 وقواعد العملة/المصروفات ذات الصلة.
- لا يبدأ بناء المنتج قبل G0، ولا تنفيذ يتطلب قرارات تقنية قبل G1.
- الاستثناء: يمكن تنفيذ إعدادات الحوكمة/التوثيق/CI الآمنة التي لا تحسم منتجًا أو تنشئ تكلفة.

## دورة المهمة
1. PICK: اقرأ Issue المطابق للدور وتأكد أنه مفتوح وغير مطالب به.
2. CLAIM: علّق: `CLAIMED — ROLE — BASE SHA — planned paths`.
3. BRANCH: أنشئ `agent/<role>/<issue-id>` من أساس مناسب.
4. WORK: غيّر أقل نطاق يحقق معيار القبول.
5. VERIFY: شغّل الاختبارات ذات الصلة وسجل الناتج الفعلي.
6. PR: افتح PR مرتبطًا بـIssue؛ لا تستهدف الدمج التلقائي.
7. HANDOFF: علّق بالـHead SHA، النتيجة، المخاطر، والـNext Role/Issue.
8. REVIEW: مراجع مستقل يراجع diff والاختبارات. MOSAAB وحده يقرر الدمج وإغلاق المرحلة.

## بروتوكول التسليم بين الوكلاء
صيغة التعليق:
- STATUS: READY_FOR_REVIEW / BLOCKED / PARTIAL
- ROLE:
- ISSUE:
- BASE_SHA:
- HEAD_SHA:
- CHANGED_PATHS:
- TEST_COMMANDS:
- ACTUAL_RESULTS:
- VERIFIED / UNKNOWN:
- RISKS:
- PR:
- NEXT_AGENT_ROLE:
- NEXT_ISSUE:

لا يعتبر Handoff مكتملًا بمجرد ذكر اسم وكيل؛ يجب أن يكون Issue التالي موجودًا ومحدد النطاق. لا يوقظ هذا التعليق حساب المزود تلقائيًا.

## سياسة GitHub
- `main` لا يستقبل تعديلات مباشرة من وكلاء.
- كل تغيير عبر فرع وPR.
- لا force-push، لا حذف ملفات/بيانات، لا أسرار في Git.
- لا merge أو production deploy أو تعديل أسرار/إعدادات إنتاجية.
- PR #1 الحالي يبقى OPEN/DRAFT حتى يراجعه MOSAAB.
- الفروع غير المدمجة لا تُعامل كأنها جزء من main؛ افحص الفرق والـSHA دائمًا.

## سلم الأولويات
P0 مانع/أمان/قرار يحجب بوابة؛ P1 أساس المنتج؛ P2 تحسين مهم؛ P3 لاحق. الحالات: VERIFIED/INFERRED/PROPOSED/UNKNOWN وFIXED_AND_TESTED/PARTIAL/NOT_RUN/NOT_REQUIRED.

## معيار الاكتمال
لا تغلق Issue إلا بعد PR مقبول، أدلة الاختبار، إغلاق الملاحظات، وعدم وجود مخاطر حرجة مخفية. لا يغلق أي وكيل PR أو يدمجه.
