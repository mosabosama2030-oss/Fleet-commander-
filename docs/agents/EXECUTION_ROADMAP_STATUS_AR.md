# حالة خارطة التنفيذ — Fleet Commander

- **تاريخ اللقطة:** 2026-11-23
- **المستودع:** `mosabosama2030-oss/Fleet-commander-`
- **الفرع المرجعي:** `main`
- **Base SHA:** `8ba4511629cb6f64e21ce9a7537c034cf77a9660`
- **التكليف:** FC-ROADMAP-01 — Issue [#40](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/40)
- **المالك:** CHATGPT-1 — Engineering Coordination
- **الحالة:** PARTIAL — خارطة الحالة والتبعيات موثقة؛ قرارات المنتج والتشغيل المتبقية محفوظة للمدير البشري.

> هذه لقطة مبنية على بيانات GitHub التي تمت قراءتها في 2026-11-23. حالة PR أو Issue قد تتغير لاحقًا؛ أعد قراءة GitHub قبل أي تنفيذ جديد.

## 1. خط الأساس المثبت

| العنصر | الحالة | الدليل |
|---|---|---|
| المستودع والفرع الافتراضي | VERIFIED | المستودع عام، والفرع الافتراضي `main` |
| HEAD الحالي وقت اللقطة | VERIFIED | `8ba4511629cb6f64e21ce9a7537c034cf77a9660` — دمج FC-011 / PR #18 |
| حماية `main` | VERIFIED | GitHub branch metadata أعاد `protected=true` و`protection.enabled=true` |
| Required Status Checks | UNKNOWN / غير مهيأة وفق metadata | لم تُرجع metadata أي contexts أو checks مطلوبة؛ لا يعني ذلك غياب جميع ضوابط الحماية |
| التكلفة | قيد تشغيلي | لا خدمة مدفوعة أو اشتراك أو تفعيل فوترة أو API مدفوع ضمن هذه الخارطة |
| سلطة الدمج والنشر | VERIFIED — سياسة مستودع | MOSAAB وحده يعتمد الدمج والنشر وقرارات المنتج والتكاليف |

يحتوي `main` بالفعل على Domain Core أولي للسيارات والشيفتات والرحلات والتصحيحات وIdempotency، وطبقة Wire، ونواة صوت حتمية، وLLM Gateway معطّل افتراضيًا، وواجهة Web RTL أولية. وجود هذه الملفات لا يعني أن المنتج مكتمل أو متصل بقاعدة بيانات أو مستضاف.

## 2. حالة حزم التنفيذ

| Issue / الحزمة | الحالة الحية | الأدلة والحدود |
|---|---|---|
| [#35 FC-API-01](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/35) | PARTIAL — PR [#41](https://github.com/mosabosama2030-oss/Fleet-commander-/pull/41) OPEN / DRAFT | Fastify development API؛ HEAD `172872154bbb8f1c156355ff968d764f0380a9fe`. CI runs #44733269827 و#44733277485 مسجلان SUCCESS على Node 22 و24؛ 153 اختبارًا ناجحًا حسب سجل التسليم. لا قاعدة بيانات؛ التخزين في الذاكرة فقط؛ Bearer token تطويري وليس مصادقة إنتاج. لا توجد مراجعات مستقلة مسجلة حتى اللقطة. |
| [#36 FC-DB-01](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/36) | BLOCKED — HUMAN DECISION | لا يوجد تعليق CLAIM أو PR ظاهر في الفحص. نص المهمة يمنع إنشاء حساب أو Provisioning أو تفعيل فوترة قبل تأكيد MOSAAB لقيود قاعدة البيانات والاستضافة. لا توجد كتابة دائمة؛ Restart يفقد بيانات FleetService الحالي. |
| [#37 FC-WEB-02](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/37) | NOT STARTED / DEPENDENCY BLOCKED | لا يوجد تعليق CLAIM أو PR ظاهر في الفحص. التكامل يتطلب عقد API مستقرًا ومراجعًا، وقرارًا واضحًا بشأن استمرار البيانات والمصادقة. يجب ألا تعرض الواجهة نجاح حفظ غير مؤكد من الخادم. |
| [#38 FC-ANDROID-01](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/38) | BLOCKED — HOST / DEVICE VERIFICATION | لا يوجد تنفيذ Android package مثبت. يتطلب اختبار PWA على HTTPS وجهاز Android فعلي؛ APK/TWA والتوقيع والنشر قرارات منفصلة. |
| [#39 FC-AI-02](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/39) | NOT RUN — DETERMINISTIC VOICE REVIEW | نواة الصوت الحتمية موجودة في `main` ضمن سجل FC-011؛ التكليف يطلب إعادة اختبار التدفقات الحالية. لا يوجد CLAIM أو PR ظاهر. LLM Gateway معطّل افتراضيًا، ولا يجوز إرسال بيانات شخصية أو تفعيل مزود قبل موافقة منفصلة. |
| [#40 FC-ROADMAP-01](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/40) | IN PROGRESS — DOCUMENTED | هذه الوثيقة توحّد الحالة والتبعيات فقط؛ لا تنفذ أو تعتمد القرارات المحجوبة. |

## 3. الأعمال المساندة المفتوحة

| PR | الحالة | النطاق والتحقق |
|---|---|---|
| [#32 FC-PWA-01](https://github.com/mosabosama2030-oss/Fleet-commander-/pull/32) | OPEN / DRAFT | Manifest وأيقونات محلية؛ سجل CI يذكر 11 اختبار Python و`node --check` ناجحة. HTTPS، قابلية التثبيت الفعلية، وفحص Android لم تُنفذ. |
| [#34 FC-TERMUX-01](https://github.com/mosabosama2030-oss/Fleet-commander-/pull/34) | OPEN / DRAFT | مستند تسليم وأوامر Termux فقط؛ وجود المستند لا يثبت تشغيل الأوامر على هاتف MOSAAB. |
| [#16 GitHub Copilot runner](https://github.com/mosabosama2030-oss/Fleet-commander-/pull/16) | OPEN / NOT DRAFT | فحوص compile/strict validation السابقة نجحت على رؤوس محددة؛ اختبار `/fc-run` end-to-end غير مثبت. لا يوقظ Claude أو ChatGPT أو Grok أو Manus تلقائيًا. |
| [#14 activation docs](https://github.com/mosabosama2030-oss/Fleet-commander-/pull/14) | OPEN / NOT DRAFT | تحديثات توثيقية؛ لا تعتبر وحدها دليل تشغيل Runtime. |
| [#1 A0 requirements](https://github.com/mosabosama2030-oss/Fleet-commander-/pull/1) | OPEN / NOT DRAFT | لم يتم دمجه أو تغيير حالته في هذا التكليف. |

## 4. ترتيب التبعيات الصحيح

1. **مراجعة FC-API-01:** مراجعة مستقلة لـPR #41، ثم قرار MOSAAB بشأن الدمج. لا تعتبر نجاح CI موافقة معمارية أو جاهزية إنتاج.
2. **حسم FC-DB-01:** يحدد MOSAAB قيودًا صريحة: قاعدة البيانات المقبولة، الاستضافة المسموحة، سقف التكلفة (صفر ضمن هذا المسار)، موقع البيانات، وسياسة النسخ والاستعادة. لا إنشاء خدمة أو حساب أو فوترة قبل ذلك.
3. **تنفيذ FC-DB-01:** بعد الاعتماد فقط؛ مطلوب migrations، عزل ملكية المستخدم، معاملات آمنة، اختبارات restart/concurrency/idempotency، وخطة backup/restore. لا ترفع بيانات حقيقية أثناء الاختبارات.
4. **تنفيذ FC-WEB-02:** اربط الواجهة بعقد API ونتائج الخادم الفعلية؛ أضف حالات loading/empty/error/retry، وامنع النجاح الوهمي. لا تضف حسابات مالية أو GPS قبل قراراتها.
5. **تحقق FC-ANDROID-01:** HTTPS معتمد وجهاز فعلي؛ تحقق من التثبيت والتشغيل المستقل وإمكانية الوصول. لا APK/TWA أو توقيع دون قرار.
6. **تحقق FC-AI-02:** اختبر التدفق الحتمي محليًا/داخل CI، ثم راجع سياسة الخصوصية والتأكيد. يظل LLM اختياريًا ومعطلًا إلى أن تعتمد التكلفة والبيانات والمزود صراحةً.

## 5. قرارات بشرية لازمة

| القرار | الحالة |
|---|---|
| اختيار DB والاستضافة ضمن قيد التكلفة الصفرية | UNKNOWN — مطلوب من MOSAAB |
| السماح بأي حساب أو خدمة خارجية أو نقل بيانات | NOT AUTHORIZED |
| اعتماد مصادقة إنتاج بدل Bearer token التطويري | NOT DECIDED |
| اعتماد قواعد DEC-03 المالية وDEC-05 المصروفات وDEC-09 العملة والتقريب | لا تستخدم قبل وجود قرار موثق |
| اعتماد DEC-10 GPS والاحتفاظ بالموقع | لا تجمع بيانات موقع قبل القرار |
| اعتماد HTTPS host واختبار Android | NOT RUN |

## 6. معايير الإغلاق

- لا تتحول أي حزمة إلى DONE لمجرد وجود فرع أو PR.
- كل PR يظل مفتوحًا ومسودة حتى المراجعة؛ لا Auto-merge.
- كل اختبار يذكر الأمر أو GitHub Actions Run والـSHA الذي اختُبر.
- الفصل بين نتيجة CI، والمراجعة المستقلة، واختبار جهاز حقيقي، واختبار النشر.
- لا أسرار في GitHub Issues أو الملفات أو سجلات الأوامر.
- لا مدفوعات أو تفعيل فوترة أو نشر إنتاجي دون موافقة منفصلة من MOSAAB.

## 7. الخطوة التالية المقترحة

**المطلوب من MOSAAB الآن:** حسم قيود DB والاستضافة في Issue #36، أو تفويض CLAUDE-1 بإعداد مقارنة مجانية موثقة فقط دون إنشاء حسابات أو خدمات. بعد هذا القرار يمكن فتح تنفيذ التخزين الدائم؛ ثم يبدأ تكامل Web وفق #37.

**حدود هذه الوثيقة:** تحديث تنسيقي مبني على GitHub metadata، PR/Issue bodies، والتعليقات وسجلات CI الموثقة. لم يتم تشغيل اختبارات محلية أو على جهاز حقيقي أثناء إعدادها. لم يحدث تعديل لكود المنتج أو إعدادات الحماية أو الأسرار أو الاستضافة، ولم يتم دمج أي PR.
