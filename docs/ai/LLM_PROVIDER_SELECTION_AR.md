# FC-AI-03 — اختيار موفري النماذج لـ Fleet Commander

**تاريخ التقييم:** 2026-11-24  
**الحالة:** PROPOSED — هذه وثيقة اختيار هندسي، وليست موافقة على تفعيل أي مزود أو إرسال بيانات حقيقية.

## 1. النتيجة التنفيذية

- **الافتراضي الحالي يبقى:** لا نموذج، لا اتصال، ولا ميزانية. `SAFE_DEFAULT_CONFIG` هو مصدر الإيقاف الحاكم.
- **مرشح التجارب المجانية:** Gemma 4 31B عبر OpenRouter، باستخدام معرف ثابت `google/gemma-4-31b-it:free`، وعلى بيانات اصطناعية أو منزوعة الهوية فقط. يدعم JSON mode، لكنه لا يفرض JSON Schema.
- **Gemini 3.1 Flash-Lite:** محول نصي فقط في هذه الشريحة. لا يُستخدم لفهم الصوت المنظم؛ ذلك يحتاج محول Gemini أصليًا واختبار schema مخصصًا. الطبقة المجانية تنص على استخدام البيانات لتحسين منتجات Google.
- **NVIDIA Nemotron 3 Ultra:** مرشح للتخطيط والتحليل النصي فقط؛ واجهة NVIDIA تصف endpoint مجانيًا، لكن Structured Output غير مدعوم. لا يُربط بمهام تتطلب JSON.
- **Mistral Small 4:** أفضل مرشح تجاري محتمل لمهام الإخراج المنظم والقدرات المتعددة، لكنه ليس مجانيًا: السعر المنشور هو 0.15 دولار/مليون Token إدخال و0.60 دولار/مليون Token إخراج. يبقى غير مفعل حتى موافقة مالية صريحة.

لا يعني وجود المحولات أن أي نموذج متصل أو أن جودة العربية المصرية قُيّمت. جميع اختبارات هذه الشريحة محاكاة محلية فقط.

## 2. مصفوفة المزودين

| المزود | Model ID المثبت | الاستخدام المقترح | JSON في هذا المحول | التكلفة/الخصوصية |
|---|---|---|---|---|
| OpenRouter | `google/gemma-4-31b-it:free` | تجارب فهم النصوص والصوت المصطنع | JSON mode؛ ليس schema enforcement | نموذج مجاني؛ الحد المنشور للمتغيرات المجانية 50 طلبًا/يوم. خطة Free لا توفر budget/spend controls أو data-policy routing. |
| Google Gemini | `gemini-3.1-flash-lite` | تلخيص نصي غير حساس بعد مراجعة الخصوصية | معطل في هذا المحول؛ يلزم محول أصلي لإخراج منظم موثوق | الطبقة المجانية تُستخدم بياناتها لتحسين منتجات Google. الطبقة المدفوعة المنشورة: 0.25$/M input و1.50$/M output. |
| Mistral | `mistral-small-2603` | مرشح مدفوع لمهام JSON المنظمة والتفسير | JSON mode؛ Gateway والمستهلك يتحققان من المحتوى | 0.15$/M input و0.60$/M output. لا تفعيل أو اتصال دون إذن دفع منفصل. |
| NVIDIA NIM | `nvidia/nemotron-3-ultra-550b-a55b` | التخطيط والتحليل النصي العميق | غير مدعوم حسب صفحة النموذج | endpoint مجاني معلن؛ بيانات الحساب/الاحتفاظ غير معتمدة هنا. لا بيانات شخصية أو سرية. |

## 3. القيود الأمنية والخصوصية

1. لا تُرسل أسماء الكابتن أو أرقام الهواتف أو اللوحات أو معرفات الرحلات أو المواقع الدقيقة أو تفاصيل الإيرادات الفردية إلى أي طبقة مجانية.
2. وظيفة `redact()` الحالية تلتقط البريد والهواتف وتسلسلات الأرقام الطويلة والإحداثيات، لكنها لا تضمن اكتشاف الأسماء والعناوين الحرة. لذلك لا يُعد التنقيح الحالي تصريحًا لإرسال نص المستخدم الحقيقي.
3. سياسة OpenRouter تذكر أن الإدخال يُرسل للمزود المختار وأن بعض المزودين قد يحتفظون به أو يستخدمونه للتدريب/التحسين وفق سياساتهم. لا تفترض أن كلمة `free` تعني خصوصية.
4. مفاتيح المزودين منفصلة ومخصصة للخادم فقط: `FC_OPENROUTER_API_KEY`, `FC_GEMINI_API_KEY`, `FC_MISTRAL_API_KEY`, `FC_NVIDIA_API_KEY`. لا تضعها في Git أو الواجهة أو السجلات أو المحادثات.
5. لا تغيّر `SAFE_DEFAULT_CONFIG` ولا تضف أي Provider ID إلى قوائم الأغراض في هذه المهمة. الإنشاء/التسجيل البرمجي لا يساوي التفعيل.

## 4. حواجز المعمارية

- جميع الطلبات تمر عبر `LlmGateway` فقط؛ لا استدعاء مباشر من ميزة صوت أو UI.
- المضيف ومعرف النموذج ثوابت في الكود؛ لا تسمح بمتغير بيئة يغير URL أو Model ID، لتقليل SSRF والتحويل الصامت إلى نموذج مدفوع.
- JSON mode ليس JSON Schema. `LlmGateway` يتحقق من التحليل، و`validateLlmIntent` يبقي القائمة البيضاء والأرقام المتطابقة مع كلام المستخدم.
- Nemotron وGemini لا يُعرضان كمزودين قادرين على JSON في هذا المحول، ولذلك يتجاوزهما Gateway تلقائيًا في الغرض الذي يطلب JSON.
- لا Tool Calling ولا function execution ولا confirmation ولا حسابات مالية عبر النموذج.
- لا تفعيل قبل وجود API مصادق عليها وملكية بيانات مؤكدة، ميزانية دائمة متزامنة، سياسة موافقة/خصوصية، مراجعة أمنية مستقلة، وموافقة MOSAAB.

## 5. اختبارات هذه الشريحة

المسموح: استجابات اصطناعية، Mock Fetch، فحص mapping للأخطاء، AbortSignal، JSON capability، عدم تسريب المفاتيح، وعدم إجراء شبكة مع `SAFE_DEFAULT_CONFIG`.

الممنوع في هذه الشريحة: live provider calls، استخدام مفاتيح حقيقية، طلبات مدفوعة، مفاتيح إنتاج، نصوص أو ملفات أو بيانات كابتن حقيقية.

**النتيجة:** إذا نجح CI فهذا يثبت عقد المحول في بيئة محاكاة فقط. لا يثبت توافر المزود أو صحة الإجابات أو سلامة إرسال بيانات المستخدم.

## 6. مصادر رسمية تمت مراجعتها

- Mistral Small 4 model / ID / context / price / capabilities: https://docs.mistral.ai/models/mistral-small-4-0-26-03
- Mistral JSON mode: https://docs.mistral.ai/inference/conversations/structured-output/json_mode
- Gemini API pricing and data-use columns: https://ai.google.dev/gemini-api/docs/pricing
- Gemini OpenAI compatibility: https://aistudio.google.com/docs/openai
- NVIDIA Nemotron 3 Ultra API/build capabilities: https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b/build
- NVIDIA Nemotron 3 Ultra API reference: https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b/apireference
- OpenRouter Gemma 4 31B free model and JSON mode: https://openrouter.ai/google/gemma-4-31b-it:free
- OpenRouter Free plan limits and no spend controls: https://openrouter.ai/pricing
- OpenRouter privacy / upstream model provider practices: https://openrouter.ai/privacy
