# لوحة تقدم مهام Fleet Commander

آخر مطابقة مع GitHub: 2026-11-15 (وقت الفحص).
المعيار: وجود Issue comment أو branch أو PR هو دليل على نشاط GitHub، لكنه لا يثبت بذاته هوية جلسة مزود خارجي.

| Issue | Role ID | ما يظهر في GitHub الآن | الحالة التشغيلية |
|---:|---|---|---|
| #2 | CHATGPT-1 | لا توجد تعليقات أو تسليم على Issue | UNCLAIMED في GitHub |
| #3 | CHATGPT-2 | لا توجد تعليقات أو تسليم على Issue | UNCLAIMED في GitHub |
| #4 | CLAUDE-1 | Claim وتسليم READY_FOR_REVIEW؛ PR #13 مفتوح | READY_FOR_REVIEW — مراجعة بشرية |
| #5 | CLAUDE-2 | لا توجد تعليقات أو تسليم على Issue | UNCLAIMED في GitHub |
| #6 | GROK-1 | فرع agent/GROK-1/FC-005 وتقرير معماري؛ لا يوجد PR مفتوح لهذا الفرع | READY_FOR_REVIEW — يلزم تسليم PR/مراجعة |
| #7 | GROK-2 | Claim وتسليم READY_FOR_REVIEW؛ فرع agent/GROK-2/FC-006 | READY_FOR_REVIEW — يلزم PR/مراجعة |
| #8 | MANUS-1 | PR #15 مفتوح وغير Draft، ملف تقرير واحد | READY_FOR_REVIEW — مراجعة بشرية |
| #9 | MANUS-2 | Claim موجود؛ الفرع agent/MANUS-2/FC-008 مطابق لـmain وقت الفحص، بلا commit إضافي | CLAIMED — لا يظهر تنفيذ في الفرع بعد |
| #10 | META-DESIGN | لا توجد تعليقات أو تسليم على Issue | UNCLAIMED في GitHub؛ يتطلب Meta AI للمرئيات |
| #11 | MOSAAB | بوابة تفعيل/تشغيل يديرها المدير البشري | HUMAN_CONTROLLED |

## ملاحظات أدلة وتعارضات

- PR #15: الحالة الفعلية من Pull Request API هي OPEN وdraft=false. نص إحدى تعليقات Issue #8 القديمة يقول Draft؛ نعتمد metadata الحالية للـPR، ونحتفظ بالتعارض كسجل تاريخي.
- Issue #8 comment يسجل HEAD SHA أقدم af904ce...، بينما PR #15 الحالي على 199972fe...؛ التعليق اللاحق على PR يطابق SHA الحالي، لذا التعليق القديم سابق لتحديث الفرع.
- Issue #6 تقرير Grok-1 على فرع لكن لا يوجد PR ظاهر؛ لا نعد المهمة مدمجة أو معتمدة.
- Issue #9 يحتوي Claim من Manus-2، لكن فرعه لم يتقدم عن main وقت الفحص. لا نعيد تكليفه تلقائيًا منعًا لتضارب العمل.
- عدم وجود تعليق على Issue لا ينفي احتمال وجود جلسة خارج GitHub؛ تعني فقط أنه لا يوجد سجل GitHub يمكن التحقق منه حتى الآن.

## سياسة تشغيل Copilot Free

يمكن استخدام الأمر /fc-run كمنفذ احتياطي لمهام #2–#9 التي لا يوجد لها Claim أو فرع عامل أو PR. لا يستخدم على مهمة عليها Claim نشط. هذا منفذ Copilot واحد وليس حسابات مزودي Role IDs المذكورين. Issue #10 يبقى Meta AI.
