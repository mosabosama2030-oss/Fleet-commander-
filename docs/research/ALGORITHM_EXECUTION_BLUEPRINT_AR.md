# مخطط تنفيذ الذكاء — Fleet Commander

- **Issue:** [FC-OSI-01](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/51)
- **PR:** [#52](https://github.com/mosabosama2030-oss/Fleet-commander-/pull/52)
- **Base:** `8ba4511629cb6f64e21ce9a7537c034cf77a9660`
- **Branch:** `agent/CHATGPT-1/FC-OSI-01`
- **التاريخ:** 2026-11-25
- **الحالة:** PROPOSED — وثيقة تخطيط وعقود واختبارات؛ ليست تنفيذًا داخل التطبيق.

> الغرض من هذا المخطط هو تحويل قائمة الخوارزميات إلى برنامج هندسي قابل للقياس، لا زيادة عدد النماذج. لا يمنح هذا المستند إذنًا لتجاوز A0/G0 أو قرارات MOSAAB أو حدود المنتج.

## 1. ملخص القرار التنفيذي

**التوصية:** بناء الذكاء على هيئة طبقات حتمية قابلة للاختبار أولًا، ثم إضافة التنبؤ فقط عندما تتوفر بيانات قانونية وممثلة. لا تبدأ بـLLM أو Deep Learning أو Reinforcement Learning.

ترتيب القيمة/المخاطر المقترح:

1. **سلامة الحدث:** مصدر موثوق، وقت الرصد، تطبيع عربي، تحقق schema، إزالة التكرار، دورة حياة العرض.
2. **الامتناع عن التخمين:** الحقول المجهولة، stale detection، selective abstention، تفسير سبب عدم التوصية.
3. **فهم العرض:** استخراج الحقول المتاحة من الإشعار المصرح به فقط، مع حفظ provenance لكل حقل.
4. **تحليل الرحلة:** لا يبدأ المحرك المالي قبل DEC-03/05/09؛ يمكن قبلها تجهيز أنواع البيانات والعقود والاختبارات الاصطناعية فقط.
5. **المكان والوقت:** H3 وتجميع الإشارات بعد اعتماد DEC-10 ومصدر البيانات وحقوقه؛ لا تُسمى كثافة الإشعارات «طلب السوق».
6. **التنبؤ:** seasonal baselines أولًا، ثم نماذج العدّ أو quantile عند ثبوت الحاجة؛ لا يقبل نموذج دون تفوق موثق على baseline.
7. **التعلم:** replay وتقييم offline فقط، دون تجارب حية أو تغيير سلوك الكابتن.

## 2. موجات التنفيذ والبوابات

| الموجة | الهدف | مخرجات مسموحة | شرط الدخول | بوابة الإيقاف |
|---|---|---|---|---|
| W0 — Governance & contracts | تثبيت الحدود والعقود والاختبارات | وثائق، schemas، fixtures اصطناعية، traceability | لا تحتاج قرارًا ماليًا أو GPS | أي غموض في صلاحيات البيانات أو ملكية المهمة |
| W1 — Event integrity | صحة الحدث ودورة حياته | pure functions وunit tests بعد G0 واعتماد مسار الإشعارات | مراجعة Android/privacy/security وموافقة G0 | لا يوجد إذن Notification Access أو صيغة إشعار موثقة |
| W2 — Offer understanding | استخراج العرض وتحديد الصلاحية | parsers حتمية وfixtures منزوعة الهوية | W1 + عينات مصرح بها لكل منصة | parser يملأ حقلاً غير موجود أو يخفي UNKNOWN |
| W3 — Trip economics | المقارنة المالية | محرك حتمي بوحدات نقدية صحيحة واختبارات golden | اعتماد DEC-03 وDEC-05 وDEC-09 كتابةً | أي قاعدة أو فئة أو تقريب غير معتمد |
| W4 — Geo & routing | ETA والمسافة والتجميع المكاني | adapters وH3 وroute contract | DEC-10 + DEC-11 + حقوق البيانات + قرار البنية | لا مصدر مسار موثوق أو لا موافقة GPS |
| W5 — Demand baselines | وصف الإشارات والتنبؤ الأولي | seasonal naive، hour-of-week median، Poisson benchmark | مصدر بيانات مصرح به، تغطية وفترة كافية | لا يمكن فصل غياب الطلب عن غياب الرصد |
| W6 — Evaluation & learning | قياس جودة التوصية والتغير | replay، calibration، drift، offline policy evaluation | outcomes موثوقة وlogging صالح واحتفاظ معتمد | لا يمكن إعادة بناء ما كان معروفًا وقت القرار |

**قاعدة التبعية:** لا تُفتح موجة لاحقة لمجرد اكتمال كود الموجة السابقة؛ يجب إغلاق بوابة الدخول واختبارات القبول ومراجعة السلامة أولًا.

## 3. ترتيب الخوارزميات حسب الجاهزية

### Tier A — أساسيات منخفضة التعقيد وعالية الأولوية

| الخوارزمية | لماذا أولًا؟ | الحد الأدنى للاختبار |
|---|---|---|
| Schema validation + field provenance (ALG-02) | يمنع اختلاط المستخرج بالمستنتج والمجهول | كل حقل يحمل المصدر والحالة ووقت الرصد |
| Arabic normalization (ALG-24) | يقلل أخطاء الأرقام والفواصل والكتابة | أرقام عربية/لاتينية، فواصل عشرية، مسافات، null |
| Idempotency + dedupe (ALG-03/19) | يمنع تكرار العرض دون دمج عرضين مختلفين | إعادة الحدث نفسه لا تنشئ عرضًا ثانيًا؛ عرضان متشابهان لا يندمجان خطأً |
| Offer lifecycle + staleness (ALG-04/18) | يمنع تقديم إشعار قديم كفرصة حية | وصول متأخر، ساعة غير موثوقة، انتهاء، إعادة تشغيل |
| Selective abstention (ALG-21) | يجعل «لا أعرف» نتيجة صحيحة | نقص حقل حرج يؤدي إلى ABSTAINED لا إلى تخمين |

### Tier B — بعد توفر عينات إشعارات قانونية

| الخوارزمية | شرط التفعيل | معيار القياس |
|---|---|---|
| Deterministic parser + parser disagreement (ALG-05/23) | fixtures موثقة من Uber/DiDi/inDrive على أجهزة مستهدفة | exact-match لكل حقل، precision/recall، نسبة abstention |
| Template drift (ALG-25) | baseline موثق لقوالب الإشعار | اكتشاف التغير دون تفسير خاطئ للقالب |
| Robust outlier checks (ALG-26) | قيم فعلية كافية مع مرجع مستقل | false-positive rate ومراجعة القيم الشاذة |

### Tier C — بعد قرارات المال والموقع ومصدر البيانات

- Profit/cost model (ALG-06/31): محجوب بـDEC-03/05/09.
- GPS quality/stop segmentation/map matching (ALG-08/32/33/34): محجوب بـDEC-10.
- Route ETA/matrix (ALG-07/28/29/30/35): محجوب بـDEC-11 وقرار التشغيل والبيانات.
- H3/spatio-temporal models (ALG-09/36/37/38/42/43): محجوبة بموافقة الموقع ومصدر البيانات وحقوقه.
- Demand forecasting (ALG-11/12/13/39/40/41): لا يبدأ دون تعريف event denominator والتغطية ومصدر مرصود قانوني.

### Tier D — تعلم وتقييم متقدم

- Counterfactual replay (ALG-48) وdrift/calibration (ALG-22/27/50/52): بعد وجود سجل أحداث ونتائج موثوقين.
- Contextual bandit وdoubly robust evaluation (ALG-45/49): Offline فقط، وبعد التحقق من propensity/logging assumptions. ممنوع online exploration في النطاق الحالي.
- Deep RL وautomated dispatch: خارج نطاق المنتج الحالي.

## 4. عقود البيانات المرجعية

العقود التالية **تصميم مقترح** وليست واجهات موجودة أو معتمدة في runtime.

### 4.1 Evidence field

كل قيمة مشتقة أو مستخرجة يجب أن تحمل دليلها:

```ts
type EvidenceStatus = "EXTRACTED" | "INFERRED" | "UNKNOWN";

type Evidence<T> = {
  value: T | null;
  status: EvidenceStatus;
  source: "notification" | "captain_input" | "approved_provider" | "derived";
  observedAt: string;
  parserVersion?: string;
  reasonCode?: string;
};
```

قواعد إلزامية:
- `UNKNOWN` تعني `value: null`؛ لا تستخدم صفرًا أو نصًا افتراضيًا بدل المجهول.
- `INFERRED` لا يتحول إلى `EXTRACTED` بسبب تكرار الاستدلال.
- لا يوجد confidence رقمي ما لم يكن معايرًا على مجموعة تحقق موثقة.
- لا تسجل النص الخام أو الإشعار الكامل إلا إذا كانت سياسة الاحتفاظ المعتمدة تسمح بذلك؛ الافتراضي في التصميم هو تقليل البيانات.

### 4.2 Normalized offer event

الحد الأدنى المقترح:

```ts
type NormalizedOfferEvent = {
  eventId: string;
  platform: "uber" | "didi" | "indrive" | "unknown";
  packageName: string;
  receivedAt: string;
  sourceEventTime: string | null;
  platformEventId: string | null;
  fingerprint: string;
  parserVersion: string;
  parseStatus: "PARSED" | "PARTIAL" | "UNPARSEABLE";
  fare: Evidence<{ amountMinor: number; currency: "EGP" }>;
  pickup: Evidence<string>;
  destination: Evidence<string>;
  distanceKm: Evidence<number>;
  durationMinutes: Evidence<number>;
  expiresAt: Evidence<string>;
};
```

- `receivedAt` هو وقت استقبال الجهاز، وليس وقت إنشاء العرض لدى المنصة.
- `sourceEventTime` لا يُملأ إلا إذا كان موجودًا ومفهوم الدلالة.
- `amountMinor` هنا شكل عقد مقترح فقط؛ لا يعني اعتماد DEC-09 أو السماح بالحساب المالي.
- لا يضمن هذا العقد أن الإشعار يحتوي كل الحقول.

### 4.3 Offer lifecycle

الحالات المقترحة:

```text
RECEIVED -> VALIDATED -> PARSED | PARTIAL | UNPARSEABLE
PARSED | PARTIAL -> CANDIDATE | NEEDS_REVIEW | ABSTAINED
CANDIDATE -> STALE | EXPIRED | SUPERSEDED | CLOSED
أي حالة -> QUARANTINED عند اكتشاف مصدر غير موثوق أو خلل أمني
```

الانتقالات يجب أن تكون حتمية، قابلة لإعادة التشغيل، ولا تعيد عرض `STALE` كعرض حي. لا تُستنتج صلاحية العرض من وقت الاستلام وحده دون سياسة مثبتة لكل مصدر.

### 4.4 Recommendation envelope

```ts
type Recommendation = {
  decision: "SHOW" | "ABSTAIN" | "NO_RECOMMENDATION";
  reasonCodes: string[];
  evidenceRefs: string[];
  missingFields: string[];
  freshness: "FRESH" | "STALE" | "UNKNOWN";
  modelVersion: string;
  generatedAt: string;
  humanActionRequired: true;
};
```

لا يتضمن العقد فعل قبول أو رفض أو نقر أو تحكم في تطبيق آخر. التوصية معلوماتية، والكابتن يتخذ الإجراء يدويًا.

## 5. سياسة التقييم والبيانات

### 5.1 مجموعة البيانات

لا تستخدم بيانات حقيقية قبل تحديد:
- المصدر وصاحب الحق والأساس المسموح للاستخدام.
- الغرض الدقيق والحقول المطلوبة والحقول المستبعدة.
- إزالة الهوية وتقليل البيانات وفترة الاحتفاظ والحذف.
- فصل بيانات التطوير عن أي بيانات إنتاجية.
- منع نقل الإشعارات الخام أو المواقع الدقيقة إلى مزود LLM أو خدمة خارجية.

قبل هذه الموافقات، استخدم fixtures اصطناعية معلّمة بوضوح على أنها synthetic؛ لا تصفها بأنها ممثلة لسلوك Uber أو DiDi أو inDrive.

### 5.2 تقسيم الاختبار

- Parser: fixtures حسب المنصة والقالب واللغة، مع مجموعة اختبار لا تستخدم أثناء تعديل القواعد.
- Time series: chronological / rolling-origin split؛ لا تقسيم عشوائي يخلط المستقبل بالماضي.
- Spatial: holdout لمناطق كاملة؛ لا تسمح بتسرب الجوار أو الخلية نفسها بين train/test عند قياس التعميم المكاني.
- Policy evaluation: سجل ما كان متاحًا لحظة القرار، لا تستخدم outcome لاحقًا كميزة وقت القرار.

### 5.3 المقاييس

| الطبقة | المقاييس |
|---|---|
| Parser | exact-match لكل حقل، precision، recall، false extraction، abstention rate |
| Event integrity | duplicate suppression، false merge، late-event handling، lifecycle transition errors |
| Freshness | stale false-negative/false-positive، age-at-display |
| Forecast | MAE/MASE أو deviance بحسب التوزيع، مقارنة baseline، interval coverage وwidth |
| Ranking | pairwise preference فقط عند وجود labels موثوقة، stability، regret في replay |
| Calibration | reliability curve، Brier/log loss عند ملاءمة المهمة، calibration error |
| Operations | p50/p95 latency، memory، timeout، failure rate، deterministic replay |
| Safety | false live-offer claims = 0 في fixtures، auto-action paths = 0، missing critical evidence never silently imputed |

لا تعتمد metric واحدة منفردة؛ يجب نشر حجم العينة والتغطية ومعدل المجهول وحدود التعميم بجانب النتيجة.

## 6. معايير قبول موحدة لكل خوارزمية

قبل قبول أي خوارزمية، يجب أن يرفق طلب التنفيذ:

1. Problem statement وقرار المستخدم الذي ستدعمه.
2. Baseline حتمي يمكن إعادة إنتاجه.
3. Data contract وحقوق المصدر ووقت الرصد.
4. Synthetic fixtures أو مجموعة بيانات مصرح بها مع provenance.
5. حالات null/partial/stale/out-of-order/duplicate/failure.
6. Deterministic fallback وabstention behavior.
7. اختبار عدم تسرب المستقبل أو المنطقة حسب طبيعة المهمة.
8. مقاييس قبل/بعد مع حجم العينة وفواصل عدم اليقين.
9. حدود زمن التنفيذ والذاكرة والاعتماديات.
10. مفتاح تعطيل/rollback دون فقد سجل الأحداث.
11. مراجعة خصوصية وأمن مستقلة.
12. اعتماد MOSAAB إذا كان التغيير يحسم قرار منتج أو بوابة.

## 7. تقسيم حزم العمل المقترح

هذا تقسيم تخطيطي لمنع تضارب الملفات؛ **ليس إنشاء Issues أو تعيين مالكين فعليين**.

| الحزمة | النطاق | مخرجات مستقلة مقترحة | الاعتماديات |
|---|---|---|---|
| FC-INT-01 Event Contracts | envelope، evidence، lifecycle، reason codes | schemas + contract tests | G0 + مراجعة أمن/خصوصية |
| FC-INT-02 Notification Adapter | Android permission، package allowlist، event adapter | Android spike + device fixtures | DEC-Android/G0 وDEC-10 حيث ينطبق |
| FC-INT-03 Offer Parser | locale parser، platform fixtures، drift | parser package + field metrics | FC-INT-01/02 |
| FC-INT-04 Decision Explanation | abstention، stale guard، reason codes | pure decision module + replay tests | FC-INT-01/03 |
| FC-INT-05 Economics | money/cost/profit | golden cases + deterministic module | DEC-03/05/09 |
| FC-INT-06 Geo & ETA | route adapter، H3، ETA intervals | provider-neutral interfaces + tests | DEC-10/11 + data rights |
| FC-INT-07 Demand Baselines | coverage-aware counts + seasonal baselines | offline evaluation report | approved demand source |
| FC-INT-08 Learning & Drift | calibration، replay، drift | offline reports | outcomes + retention approval |

**قاعدة الملكية:** Issue واحدة = منفذ واحد. لا تُنفذ حزمتان متوازيتان إذا كانتا تعدلان الملف أو العقد المشترك نفسه. تُراجع العقود قبل بدء المستهلكين لها.

## 8. مصفوفة المخاطر والإيقاف

| الخطر | الإشارة | الاستجابة الإلزامية |
|---|---|---|
| إشعار ناقص | missing critical field | ABSTAIN، لا تعويض تخميني |
| إشعار قديم | unknown source time أو stale threshold | عرض الحالة بوضوح، لا live claim |
| تغير قالب المنصة | parser disagreement / drift | quarantine أو NEEDS_REVIEW |
| تكرار/إعادة تشغيل | duplicate/replay | idempotent processing |
| مصدر غير مصرح | unknown provenance/rights | block ingestion/use |
| ضعف التغطية | low exposure/coverage | لا استنتاج عن الطلب |
| انحياز منطقة/زمن | spatial/temporal holdout degradation | إيقاف التعميم ونشر حدود الاستخدام |
| مزود خارجي غير متاح | timeout/rate limit | fallback محلي؛ لا false success |
| توصية غير مستقرة | small input perturbation changes ranking | ABSTAIN أو عرض sensitivity |
| تجاوز حدود المنتج | auto-action / platform control path | رفض التغيير بالكامل |

## 9. قرارات بشرية لا يحسمها هذا المخطط

| القرار | الحالة | ما لا يجوز فعله قبل الحسم |
|---|---|---|
| DEC-03 أمثلة الشيفت والمعادلة المالية | UNKNOWN | لا Profit Engine runtime |
| DEC-05 تصنيفات المصروفات | UNKNOWN | لا cost attribution |
| DEC-09 وحدة EGP الصغرى والتقريب | UNKNOWN | لا حساب/عرض مالي نهائي |
| DEC-10 موافقة GPS والعينات والاحتفاظ | UNKNOWN | لا GPS مستمر أو map matching |
| DEC-11 مزود الخرائط والمسارات | UNKNOWN | لا provider production selection |
| مصدر الطلب وحقوقه | UNKNOWN | لا ادعاءات طلب مدينة/منطقة |
| Android native vs hybrid | UNKNOWN | لا حسم مسار تنفيذ Android |
| صيغ إشعارات المنصات على الجهاز المستهدف | UNKNOWN | لا ادعاء دعم منصة مكتمل |
| DB/hosting الإنتاجي | HUMAN DECISION | لا provisioning أو تكاليف أو نشر |

## 10. ما يمكن تنفيذه لاحقًا دون تجاوز البوابات

بعد مراجعة واعتماد G0، يمكن اقتراح شريحة pure-domain محدودة لا تتصل بالنظام أو الشبكة:
- تطبيع نص عربي اصطناعي.
- schema validation وfield provenance.
- dedupe/idempotency على معرفات اصطناعية.
- state machine وstaleness باستخدام fake clock.
- abstention/reason codes.
- fixtures تغطي null/partial/malformed/duplicate/out-of-order.

هذه قائمة مرشحة فقط؛ لا تعتبر إذنًا بالتنفيذ الحالي ولا تتجاوز مراجعة الخصوصية أو تعليمات المستودع.

## 11. الحالة والاختبارات

- **VERIFIED:** هذه الوثيقة أضيفت كخطة تصميم ضمن نطاق البحث والتوثيق في Issue #51.
- **PROPOSED:** الموجات، العقود، tiers، metrics، تقسيم الحزم، ومعايير الإيقاف.
- **UNKNOWN:** صيغ إشعارات المنصات الفعلية، البيانات المحلية المصرح بها، قرارات المال/GPS/المسارات والبنية.
- **NOT_RUN:** لم تُشغّل اختبارات منتج أو upstream builds؛ هذه الوثيقة لا تضيف كودًا أو dependencies.
- **NOT_REQUIRED:** اختبارات المنتج لهذه الإضافة التوثيقية فقط.
- `git diff --check`: NOT_RUN عبر بيئة Git CLI.
- لا يوجد ادعاء بأن أي خوارزمية في هذا المخطط منفذة أو مفعلة.

---

**الخلاصة الهندسية:** Fleet Commander يصبح أكثر ذكاءً عندما يعرف ما الذي يعرفه، وما الذي لا يعرفه، ولماذا يوصي أو يمتنع. لا يُقاس التقدم بعدد الخوارزميات، بل بانخفاض الأخطاء، وتحسن القرار على بيانات مصرح بها، وثبات السلوك، وبقاء الكابتن صاحب القرار النهائي.
