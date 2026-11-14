# فهرس تكليفات وكلاء Fleet Commander

- المستودع: https://github.com/mosabosama2030-oss/Fleet-commander-
- الفرع الذي يحتوي تعليمات التشغيل: `chore/multi-agent-operating-system`
- مصدر المتطلبات الأحدث غير المدمج وقت الإنشاء: `session/05-tech-auth-gps`
- PR #1: يبقى OPEN/DRAFT ولا يُدمج دون MOSAAB.

## الحسابات والمهام

| Role ID | الحساب | Issue | المهمة | المخرج |
|---|---|---:|---|---|
| CHATGPT-1 | ChatGPT الأول | [#2](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/2) | تنسيق خط الأساس وفهرس المهام | Baseline audit + task index |
| CHATGPT-2 | ChatGPT الثاني | [#3](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/3) | مراجعة مستقلة للأمان وجودة A0 | Security/QA review |
| CLAUDE-1 | Claude الأول | [#4](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/4) | خيارات Backend/DB/Hosting | Technical decision matrix |
| CLAUDE-2 | Claude الثاني | [#5](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/5) | Web/PWA وتجربة الاستخدام | UX implementation spec |
| GROK-1 | Grok الأول | [#6](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/6) | المعمارية وتعارضات الفروع | Architecture consistency review |
| GROK-2 | Grok الثاني | [#7](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/7) | الاختبارات والتتبع | Test execution blueprint |
| MANUS-1 | Manus الأول | [#8](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/8) | رحلة Captain والقرارات المفتوحة | Workflow gap report |
| MANUS-2 | Manus الثاني | [#9](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/9) | CI والتشغيل والإصدار | Operations/release plan |
| META-DESIGN | Meta AI | [#10](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/10) | الاتجاه البصري ونظام التصميم | Design package |

## قواعد التكليف
- هذه IDs هويات تشغيلية؛ لم تُربط بعد بحسابات GitHub فعلية. لذلك Issues بلا assignees أو mentions.
- كل حساب ينفذ Issue واحدًا فقط في نطاقه. لا يطالب Issue يخص حسابًا آخر.
- قبل التنفيذ: يكتب CLAIM في Issue ويحدد Base SHA والفرع والمسارات.
- اسم الفرع: `agent/<role-id>/FC-00N`.
- التسليم عبر PR مرتبط بالـIssue، ويفضل Draft حتى مراجعة الاختبارات.
- الوكيل التالي يقرأ handoff ويؤكد CLAIM في جلسته؛ التعليق لا يشغّل حسابًا آخر تلقائيًا.
- الأدوار الثمانية البرمجية/الهندسية تعمل بالتوازي في التحليل والتصميم غير المتداخل. لا يبدأ تنفيذ المنتج المالي قبل إغلاق قرارات A0 وموافقة G0.
- Meta Design يعمل بالتوازي على استكشاف بصري غير نهائي، ثم ينتظر اعتماد الموجز قبل اعتبار Tokens نهائية.

## أولويات A0 التي يجب عدم تجاوزها
الوثائق الأحدث على `session/05-tech-auth-gps` تشير إلى: DEC-03 يحتاج مثالَي شيفت؛ DEC-05 تصنيفات المصروفات؛ DEC-09 العملة/التقريب؛ DEC-08 الخادم والاستضافة والقاعدة؛ DEC-10 الاحتفاظ بالموقع وفترة العينات وقيد PWA foreground؛ DEC-11 مزود الخرائط مؤجل. تحقق من أحدث Commit قبل اتخاذ أي قرار.

## بوابة بشرية منفصلة
- [FC-010 — Issue #11](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/11): ربط هويات/صلاحيات الوكلاء، تفعيل حماية main، وتقرير اعتماد Agent Runtime للأتمتة الحقيقية. هذه ليست مهمة لوكيل ولا يجوز إغلاقها بادعاء غير مختبر.

## معيار التقدم
لا يعلن أي دور DONE بسبب كتابة مستند فقط؛ يجب إرفاق دليل، ومراجعة مستقلة، وحالة اختبار صادقة. قرارات المنتج والانتقال بين البوابات والدمج والنشر ملك MOSAAB.
