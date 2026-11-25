# كتالوج الخوارزميات والمشاريع المفتوحة — Fleet Commander

- **Issue:** [FC-OSI-01](https://github.com/mosabosama2030-oss/Fleet-commander-/issues/51)
- **المستودع:** `mosabosama2030-oss/Fleet-commander-`
- **Base SHA:** `8ba4511629cb6f64e21ce9a7537c034cf77a9660`
- **الفرع:** `agent/CHATGPT-1/FC-OSI-01`
- **التاريخ:** 2026-11-25
- **الحالة:** RESEARCH / PROPOSED — لا يوجد تنفيذ runtime في هذا المستند.

> هذا المستند يحدد ما ينبغي دراسته وإعادة استخدامه، وليس إعلاناً عن دمج أي مشروع خارجي أو تشغيل خوارزمية إنتاجية. جميع الروابط إلى مشاريع خارجية هي مصادر مرجعية مستقلة. لا تُنسخ ملفات أو تبعيات منها قبل مراجعة الترخيص والإصدار والاعتماديات والاختبارات.

## 1. القرار المعماري

**Hybrid Open-Source Strategy — معتمدة كتوجه عمل:**
1. نعيد استخدام المكتبات العامة ذات الترخيص الواضح عندما توفر قدرة مستقلة ومناسبة.
2. نعيد تنفيذ منطق المنتج الأساسي داخل Fleet Commander حتى نملك العقود والاختبارات والخصوصية وسلوك UNKNOWN.
3. لا ندمج تطبيقاً خارجياً كاملاً ولا نربط النظام بمشروع upstream وقت التشغيل دون سبب هندسي موثق.
4. نبقي كل upstream مستقلاً ونوثق مصدر كل فكرة/مكوّن ورخصته ونسخته.
5. لا يُسمح لأي مشروع خارجي بتغيير حدود المنتج أو سلطات الكابتن.

### حدود المنتج التي لا يجوز تجاوزها

- نمط المنتج: COMMANDER intelligence؛ الكابتن هو صاحب القرار النهائي لقبول/رفض الرحلة.
- التكامل مع Uber وDiDi وinDrive: مسار الإشعارات فقط، بعد إذن Android المناسب.
- التواصل مع الكابتن: Screen only.
- ممنوع: Accessibility automation، النقر على أزرار المنصات، auto-accept/decline، اعتراض الشبكة، private APIs، تجاوز الحماية، أو scraping يخالف شروط الخدمة.
- لا نعلن وجود API رسمي لبيانات عروض السائقين دون مستند رسمي واضح.
- لا نرسل بيانات الرحلات أو الموقع الدقيق أو معرفات الكابتن إلى مزود خارجي دون قرار وموافقة منفصلين.

## 2. سجل المشاريع المفتوحة — أدلة وموقف إعادة الاستخدام

تاريخ الـcommit أدناه هو أحدث commit أعاده GitHub Search عند الفحص، وليس ضماناً لاستمرار الحالة بعد تاريخ هذا التقرير. تمت مراجعة README والترخيص حيث يذكر ذلك صراحة.

| المشروع | المجال | الترخيص الذي تم التحقق منه | قرار Fleet Commander | ملاحظات / حدود |
|---|---|---|---|---|
| [GigFlow](https://github.com/w0wzahh/GigFlow) — commit [dfd7f824](https://github.com/w0wzahh/GigFlow/commit/dfd7f82492f5c87cd07e2d16620e4c2295c5a42e) | Offer scoring، mileage، earnings، diagnostics | MIT؛ ملف LICENSE blob `0bf85fcd6ad4e7456703f58d65d6a81d11fda3b8` | **REIMPLEMENT** | README يذكر AccessibilityService وقراءة الشاشة وdispatchGesture والقبول/الرفض الآلي. هذه المسارات مرفوضة لدينا. يمكن دراسة مبادئ diagnostics، stale offer handling، GPS jitter/teleport filtering، وفصل parser/ranker دون نسخ تنفيذ غير متوافق. |
| [RideRoute Assistant](https://github.com/techykishan/rideroute-assistant) — commit [da9f36df](https://github.com/techykishan/rideroute-assistant/commit/da9f36df12816ed5cd143895ebcfcc64dc7ad0ef) | inDrive/Rapido offer parsing، net saving، ranking | **UNKNOWN**؛ لم يوجد ملف LICENSE في المسار القياسي عند الفحص | **REIMPLEMENT / NO CODE COPY** | README يصف قراءة الشاشة عبر Accessibility، حساب fare − commission − fuel، وترتيب العروض. التطبيق يعلن read-only، لكن مصدر البيانات وطريقة القراءة لا يطابقان مسار الإشعارات. لا تنسخ الكود حتى يظهر ترخيص صريح. |
| [NotificationForwarder](https://github.com/ItsAzni/NotificationForwarder) — commit [b2f7e9e3](https://github.com/ItsAzni/NotificationForwarder/commit/b2f7e9e3d87c79cb6644f0ac5f94287ac7b62cb7) | Android NotificationListenerService، Room، WorkManager، webhook | MIT؛ ملف LICENSE blob `5c4bd0bbd392c0a0205e07d6fad3c844e0b6245c` | **ACCEPT FOR SPIKE — PATTERNS ONLY** | دراسة allowlist/filtering، فصل listener عن parser، وإدارة أخطاء الإرسال. Offline queue وإعادة المحاولة ليست قراراً معتمداً؛ تعليمات main تصف المنتج Online-only. لا نرسل الإشعار الخام تلقائياً إلى webhook. |
| [Uber H3 Core](https://github.com/uber/h3) — commit [03135828](https://github.com/uber/h3/commit/03135828ecde394ab4a3779051ccc094562669ae) | Spatial indexing، hex cells، neighborhood/flow | Apache-2.0؛ ملف LICENSE blob `261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64` | **ACCEPT FOR SPIKE** | مرشح قوي لتجميع أحداث الموقع في خلايا مكانية متعددة الدقة. لا يعني وجود H3 وجود بيانات طلب؛ يلزم مصدر بيانات مستقل وقرار DEC-10/DEC-11. |
| [H3-Java](https://github.com/uber/h3-java) — commit [f18f3411](https://github.com/uber/h3-java/commit/f18f34118ecaa9ff22805530d83c6aea66a7637b) | H3 bindings لـJava وAndroid | Apache-2.0؛ ملف LICENSE blob `37888c0d31b852b3f03738ae336947e224116947` | **ACCEPT FOR SPIKE** | README يذكر دعم Android ARM/ARM64. مناسب لدراسة جانب Android إذا اعتمد H3؛ لا يثبت توافقه مع هيكل Android الحالي الذي لم يُحسم بعد. |
| [Valhalla](https://github.com/valhalla/valhalla) — commit [999bbcc6](https://github.com/valhalla/valhalla/commit/999bbcc6a3edc1c008a7ef56f5c6fd7c177d79c9) | Routing، matrix، isochrones، map matching | MIT؛ ملف COPYING blob `dc630bdee599751377ef8cdc42cfc392b12c5f4b` | **ACCEPT FOR SPIKE / PROVIDER CANDIDATE** | يدعم توجيه القيادة وطرقاً أخرى وtime-distance matrices وmap matching. استضافته تتطلب بيانات خرائط وبنية تشغيل؛ لا تستخدم demo server كاعتماد إنتاجي. |
| [OSRM](https://github.com/Project-OSRM/osrm-backend) — commit [578a1206](https://github.com/Project-OSRM/osrm-backend/commit/578a12065917e02bf14bb4568f12a2d3c388ba15) | Route، Table، Nearest، Match | BSD 2-Clause؛ ملف LICENSE.TXT blob `779b5db50b57238cb9f67d55c0252560d053036b` | **ACCEPT FOR SPIKE / PROVIDER CANDIDATE** | يوفر مسافة ومدة مسار ومصفوفة أزمنة/مسافات وmap matching. إعداد خادم وOSM extract يحتاج موارد وتشغيلاً؛ لا نعتبر demo API خدمة إنتاج مجانية مضمونة. |
| [scikit-mobility](https://github.com/scikit-mobility/scikit-mobility) — commit [9433d05a](https://github.com/scikit-mobility/scikit-mobility/commit/9433d05a4cf7f42144e2e92279098740521493e2) | Trajectories، OD flows، mobility metrics، privacy risk | BSD 3-Clause؛ ملف LICENSE blob `7cbdc6f3538f0081e451b91dd11dec5e0e7fece5` | **REIMPLEMENT / RESEARCH REFERENCE** | Python library، بينما backend الحالي TypeScript. نستفيد من مفاهيم TrajDataFrame وFlowDataFrame ومخاطر إعادة التعرف؛ لا نضيف Python runtime الآن. |
| [urbanflow-ml](https://github.com/gbadedata/urbanflow-ml) — commit [d7631ccd](https://github.com/gbadedata/urbanflow-ml/commit/d7631ccd6cd7d491e82130da7a25ec4a64b2e4e7) | Hourly zone demand forecasting، leakage controls، prediction intervals | MIT؛ ملف LICENSE blob `f424d7de4f3ec23e58138b2c3a2a067d9ee530a0` | **RESEARCH REFERENCE / SPIKE LATER** | README يصف NYC TLC data وhour-of-week median وPoisson regression وgradient boosting مع اختبار زمني وفترات تنبؤ. بيانات نيويورك ليست دليلاً على طلب القاهرة؛ pipeline ثقيل ويحتاج بيانات وتحققاً محلياً. |
| [inDrive Bot](https://github.com/mrrobot0o/indrive-bot) | Auto-accept، Accessibility، VPN/Proxy/Root | لم يُراجع الترخيص | **REJECT** | يصف قبولاً تلقائياً واعتراض API/Root/Xposed. مخالف لحدود السلامة والمنتج؛ لا نستخدمه ولا ننسخ منه. |

### نتيجة خاصة بمنصات النقل

- **Uber:** وجدنا مشاريع مستقلة تحلل عروض السائق، لكن أبرز مرشح مثل GigFlow يعتمد على Accessibility وليس Notifications. لا يوجد إثبات API رسمي عام لعروض السائق في الأدلة التي فُحصت.
- **inDrive:** RideRoute مشروع ذو صلة مباشرة، لكن ترخيصه غير ظاهر في المسار القياسي وطريقة إدخال البيانات ليست مسارنا المعتمد. نعيد تنفيذ منطق الحساب بعد اعتماد قواعدنا.
- **DiDi:** **UNKNOWN** — لم أجد في البحث الحالي مشروعاً مفتوحاً موثوقاً يثبت تكاملاً متوافقاً مع إشعارات DiDi للسائق. لا نستنتج من ذلك عدم وجوده مطلقاً.
- **Notifications:** Android الرسمي يوفر `NotificationListenerService` لاستقبال أحداث الإشعارات بعد تهيئة الخدمة ومنح المستخدم Notification Access. هذا لا يضمن أن إشعار المنصة يحتوي جميع حقول العرض أو أن العرض لا يزال صالحاً.

## 3. مكتبة الخوارزميات التي يحتاجها Fleet Commander

الحالة في العمود الأخير تصف قرار التصميم، وليست حالة تنفيذ.

| ID | المحرك | الخوارزمية / النمط | الاستخدام | الأولوية / القيد |
|---|---|---|---|---|
| ALG-01 | Event Ingestion | Allowlist + normalized event envelope | قبول إشعارات الحزم المعتمدة وتحويلها إلى حدث موحد | P0؛ يتطلب Android وقرار الخصوصية |
| ALG-02 | Event Quality | Schema validation + field-level provenance | التمييز بين extracted / inferred / unknown لكل حقل | P0 |
| ALG-03 | Deduplication | Platform event ID؛ وإلا fingerprint من حقول مطبّعة ونافذة زمنية | منع تكرار الإشعار أو إعادة الإرسال | P0؛ لا تستخدم fingerprint وحده كهوية رحلة نهائية |
| ALG-04 | Offer Lifecycle | State machine + expiry/staleness guard | NEW → PARSED → CANDIDATE → STALE / EXPIRED / UNKNOWN | P0؛ مدة الصلاحية تحتاج قياساً خاصاً بكل منصة |
| ALG-05 | Parsing | Deterministic locale-aware parser | استخراج الأجرة والمسافة والوقت ومكان الالتقاط عند وجودها بالنص | P0؛ لا OCR أو Accessibility ضمن النطاق |
| ALG-06 | Profit | Deterministic cost accounting | صافي عائد الرحلة وتكلفة الكيلومتر والعائد/ساعة | BLOCKED حتى اعتماد DEC-03/05/09 |
| ALG-07 | Routing | Road-network route + distance/time matrix | تقدير مسافة الطريق ووقت الوصول | P1؛ اختيار provider محجوب بقرار DEC-11 |
| ALG-08 | GPS Quality | Accuracy gate + outlier/teleport detection + optional map matching | منع قفزات GPS من إفساد المسافة | BLOCKED حتى DEC-10 |
| ALG-09 | Spatial Index | H3 cell indexing + neighbor rings + hierarchical aggregation | تجميع الأحداث حسب المنطقة والفترة | P1؛ H3 لا يخلق بيانات طلب |
| ALG-10 | Demand Proxy | Counts by cell × hour × weekday, exposure-normalized | قياس كثافة الإشارات المرصودة لا الطلب الحقيقي | P1؛ يجب تسمية المصدر والنطاق بوضوح |
| ALG-11 | Forecast Baseline | Seasonal naive (same hour last week) | حد أدنى مرجعي لا بد أن يتفوق عليه أي نموذج | P1؛ لا تنبؤ دون سجل صالح |
| ALG-12 | Forecast Baseline+ | Hour-of-week trailing median / EWMA | تقدير مستقر منخفض التكلفة مع مقاومة الضوضاء | P1؛ نافذة التاريخ تُحدد من البيانات |
| ALG-13 | Count Forecast | Poisson regression؛ ثم Gradient Boosting with Poisson loss | توقع عدد أحداث/رحلات في منطقة وفترة | P2؛ بعد توفر بيانات ممثلة واختبار زمني |
| ALG-14 | Uncertainty | Quantile prediction intervals + calibration | إظهار نطاق التوقع لا رقم زائف الدقة | P2 |
| ALG-15 | Candidate Area | Expected value − reposition cost − uncertainty penalty | مقارنة البقاء والتحرك لمنطقة أخرى | P2؛ أوزان القرار لا تعتمد قبل replay وبيانات |
| ALG-16 | Multi-Offer Decision | Hard safety filters + Pareto/lexicographic ranking + explanation | ترتيب عروض مرصودة وفق الربح/الوقت/المخاطر | P1؛ لا قبول أو رفض تلقائي |
| ALG-17 | Learning & Evaluation | Event outcome feedback + rolling-origin backtest + drift checks | مقارنة التوقع بالواقع وتحسين النموذج | P2؛ قبول التوصية ليس دليلاً على صحة التوصية |

## 4. عقود الخوارزميات المقترحة

### 4.1 Unified Offer Event

الحد الأدنى المقترح لكل حدث:

```ts
type EvidenceValue<T> = {
  value: T | null;
  status: "EXTRACTED" | "INFERRED" | "UNKNOWN";
  source: "notification" | "captain_input" | "route_provider" | "derived";
  observedAt: string;
};

type NormalizedOfferEvent = {
  eventId: string;
  platform: "uber" | "didi" | "indrive";
  packageName: string;
  receivedAt: string;
  platformEventId: string | null;
  fingerprint: string;
  parseVersion: string;
  parseStatus: "PARSED" | "PARTIAL" | "UNPARSEABLE";
  parseConfidence: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  fare: EvidenceValue<{ amountMinor: number; currency: "EGP" }>;
  pickupText: EvidenceValue<string>;
  destinationText: EvidenceValue<string>;
  pickupCoordinate: EvidenceValue<{ lat: number; lon: number }>;
  tripDistanceMeters: EvidenceValue<number>;
  pickupEtaSeconds: EvidenceValue<number>;
  expiresAt: EvidenceValue<string>;
  lifecycle: "NEW" | "CANDIDATE" | "STALE" | "EXPIRED" | "UNKNOWN";
};
```

ملاحظات:
- `amountMinor` هو تمثيل صحيح بوحدة العملة الصغرى؛ لا floating point للمال.
- لا يُحوّل نص المكان إلى إحداثيات إلا عبر مصدر geocoding معتمد، ولا يُعرض الناتج كحقيقة دون provenance.
- لا تُملأ `expiresAt` بتخمين ثابت. إذا لم نعرف صلاحية العرض، تبقى UNKNOWN وتُمنع توصية تعتمد على أنه ما زال متاحاً.
- `parseConfidence` وصف لجودة الاستخراج وليس احتمالاً إحصائياً ما لم تتم معايرته.

### 4.2 Deduplication

ترتيب المفاتيح:
1. معرّف المنصة إذا كان متاحاً وثابتاً.
2. وإلا fingerprint من: platform + normalized fare + normalized pickup/destination text + distance + bounded time bucket.
3. يجب الاحتفاظ بوقت أول وآخر مشاهدة وعدد التكرارات.
4. لا تدمج حدثين متشابهين في رحلة واحدة إذا كان ذلك سيخفي عرضاً جديداً؛ اختبر حدود نافذة التكرار ببيانات fixtures.

### 4.3 Profit Engine — تصميم فقط، التنفيذ محجوب

المكونات التي يجب فصلها:
- Fare shown to captain.
- Gross fare / platform payout.
- Platform commission أو أي خصم مثبت.
- Incentives / tips عند إثباتها.
- Fuel cost.
- Variable maintenance cost.
- Other shift-attributable costs.
- Deadhead distance/time للوصول إلى pickup أو repositioning.

صيغة العمل المفاهيمية:

```
NetTripContribution =
  confirmed_driver_payout
  + confirmed_incentives
  + confirmed_tips
  - confirmed_fuel_cost
  - confirmed_variable_maintenance
  - approved_allocated_costs
```

لا تخصم عمولة المنصة مرتين إذا كانت القيمة المدخلة هي صافي مستحق الكابتن بالفعل. ولا تستبدل قيمة غير معروفة بتقدير صامت. قبل اعتماد DEC-03/05/09، لا ينفذ الكود المالي ولا يعرض صافي ربح تشغيلي.

### 4.4 Route / ETA

- استخدم Route API أو محركاً ذاتي الاستضافة لحساب مسار الطريق، لا المسافة الخطية وحدها.
- استخدم Table/Matrix لمقارنة عدة نقاط أو مناطق.
- استخدم Match فقط عند وجود GPS traces مصرح بها وقرار الاحتفاظ بها.
- OSRM يعيد duration بالثواني وdistance بالأمتار في Table؛ المسافة هنا لمسار الطريق الأسرع وليست المسافة الهندسية الأقصر.
- لا تدّعِ ازدحاماً حياً إذا كان المحرك لا يملك traffic feed.
- أظهر provider، وقت الحساب، ونوع القيمة: actual / estimated / unavailable.

### 4.5 Spatial Demand Proxy

1. تحويل نقطة مصرح بها إلى H3 cell.
2. تجميع الإشارات المرصودة حسب cell وtime bucket وday-of-week.
3. حفظ مصدر الإشارة ونوعها وعدد العينات والفترة.
4. فصل عدد العروض التي رآها هذا الكابتن عن الطلب الكلي في السوق؛ الأول ليس مقياساً مباشراً للثاني.
5. لا تنشر إحصاءات خلايا صغيرة قد تكشف تحركات شخص بعينه؛ حد التجميع والاحتفاظ يحتاجان قرار خصوصية.

### 4.6 Forecasting Ladder

ترتيب التجربة الإلزامي:
1. Seasonal naive: نفس الساعة في الأسبوع السابق.
2. Hour-of-week trailing median أو EWMA.
3. Poisson regression للعدّادات غير السالبة.
4. Gradient boosting with Poisson objective إذا تفوق على baseline في rolling-origin holdout.
5. Quantile models أو prediction intervals بعد قياس التغطية والانحياز.

لا نبدأ بـLSTM/GRU أو deep learning. لا توجد حالياً بيانات قاهرية موثوقة مثبتة في المستودع. بيانات NYC أو أي مدينة أخرى تصلح لاختبار pipeline فقط، لا لتوقع طلب القاهرة.

### 4.7 Candidate Area Score

المعادلة المرشحة بعد توافر البيانات:

```
CandidateAreaValue =
  expected_trip_contribution
  - repositioning_cost
  - uncertainty_penalty
  - opportunity_cost_of_travel
```

الأوزان وحدود القرار UNKNOWN حتى جمع بيانات ميدانية كافية واختبارها. لا تستخدم كثافة تاريخية وحدها لتوصية بالتحرك؛ يجب احتساب تكلفة الوصول وفرص الرحلات أثناء الانتقال.

### 4.8 Model Validation

- Chronological split فقط؛ ممنوع random shuffle لتنبؤ زمني.
- Rolling-origin backtest مع فصل واضح بين وقت الملاحظة ووقت التوقع.
- كل lag/rolling feature يجب أن يعتمد على بيانات متاحة قبل لحظة التوقع.
- قارن MAE وWAPE وPoisson deviance وvolume bias؛ لا تختَر metric واحداً إذا كان يخفي انحياز المناطق الصغيرة.
- افحص coverage لفترات التنبؤ وcalibration.
- سجل أداء cold-start، المناطق قليلة البيانات، وفشل المصدر.
- قيّم القرار بإعادة تشغيل أحداث تاريخية، وقارن النتيجة الفعلية بخط أساس واضح.
- لا تعتبر Acceptance Rate أو رضا المستخدم وحدهما دليلاً على زيادة صافي الربح.

## 5. حزم التنفيذ المتوازية بعد البوابات

يمكن أن تسير حزم البحث/التصميم بالتوازي، لكن التنفيذ المتداخل في الملفات نفسها ممنوع:

| Work package | المخرجات | التبعية / البوابة |
|---|---|---|
| OSI-A — Android notifications | Permission flow، package allowlist، event envelope، lifecycle tests | Android architecture + privacy/security review |
| OSI-B — Offer normalization | Platform adapters وfixtures لكل صيغة إشعار | OSI-A؛ لا private APIs |
| OSI-C — Financial model | Money schema، cost categories، golden cases | DEC-03/05/09 approval |
| OSI-D — Routing | Provider ADR، route/matrix adapter contract، provider limits | DEC-11 + zero-cost/hosting decision |
| OSI-E — Spatial analytics | H3 indexing، aggregation، privacy thresholds | DEC-10 + authorized source |
| OSI-F — Forecasting | Seasonal baselines، Poisson benchmark، rolling backtest | Data source + minimum usable history |
| OSI-G — Commander decision | Ranking, explanation, stale/unknown guards | OSI-B/C/D/E; all hard gates |
| OSI-H — Learning | Feedback schema, replay, drift and calibration | Reliable outcomes and approved retention |

لا يبدأ تنفيذ Android أو GPS أو الحساب المالي لمجرد أن هذا الجدول موجود.

## 6. اختبارات القبول المطلوبة

### Event / notification
- package غير مسموح به → ignored.
- permission revoked / listener disconnected → status visible, no false success.
- duplicate event → no duplicate offer.
- same fare but different offer → not incorrectly merged.
- partial or malformed Arabic/English notification → PARTIAL/UNKNOWN, never guessed.
- stale notification → STALE; no live-offer claim.
- notification with prompt-injection text → treated as untrusted data.

### Profit
- integer minor units only.
- commission not subtracted twice.
- missing fuel price / consumption / distance → UNKNOWN.
- tips and incentives only when confirmed.
- currency rounding follows DEC-09.
- golden cases approved by MOSAAB before runtime implementation.

### Geo / routing
- coordinate validation and accuracy threshold.
- GPS teleport/outlier fixture.
- route unavailable / no route / provider timeout → explicit unavailable.
- road distance and straight-line distance never share the same label.
- no demand prediction when sample is insufficient.
- privacy aggregation and retention tests after DEC-10.

### Forecast / decision
- no future leakage in features.
- chronological holdout reproducible.
- baseline reported beside every advanced model.
- prediction interval coverage measured.
- no area recommendation when source freshness or coverage is insufficient.
- no auto-accept, auto-decline or vehicle control under any test.

## 7. البوابات والقرارات المفتوحة

| القرار | الحالة | ما يمنعه |
|---|---|---|
| DEC-03 financial examples and formula | UNKNOWN / awaiting approval | Profit Engine runtime |
| DEC-05 expense categories | UNKNOWN / awaiting approval | Cost attribution |
| DEC-09 EGP minor units and rounding policy | UNKNOWN / awaiting approval | Financial display/calculation |
| DEC-10 GPS consent, sampling and retention | UNKNOWN / awaiting approval | Continuous GPS and map matching |
| DEC-11 routing/map provider | UNKNOWN / awaiting approval | Production route provider |
| demand data source and rights | UNKNOWN | City-wide demand claims |
| Android native vs hybrid implementation | UNKNOWN | Android integration build |
| Uber/DiDi/inDrive notification formats on target device | UNKNOWN | Platform parser acceptance |
| production DB/hosting | HUMAN DECISION / unresolved | Persistence and provider hosting |

**A0 → G0 remains mandatory.** This catalogue does not grant an exception.

## 8. المصادر التقنية

### Upstream projects
- GigFlow: https://github.com/w0wzahh/GigFlow
- RideRoute Assistant: https://github.com/techykishan/rideroute-assistant
- NotificationForwarder: https://github.com/ItsAzni/NotificationForwarder
- Uber H3: https://github.com/uber/h3
- H3-Java: https://github.com/uber/h3-java
- Valhalla: https://github.com/valhalla/valhalla
- OSRM: https://github.com/Project-OSRM/osrm-backend
- scikit-mobility: https://github.com/scikit-mobility/scikit-mobility
- urbanflow-ml: https://github.com/gbadedata/urbanflow-ml
- inDrive bot — rejected: https://github.com/mrrobot0o/indrive-bot

### Official / technical references
- Android NotificationListenerService: https://developer.android.com/reference/android/service/notification/NotificationListenerService
- H3 overview and concepts: https://h3geo.org/docs/
- OSRM HTTP API: https://github.com/Project-OSRM/osrm-backend/blob/master/docs/http.md
- scikit-mobility trajectory and flow model: https://github.com/scikit-mobility/scikit-mobility
- Uber engineering explanation of H3: https://www.uber.com/us/en/blog/h3/
- Taxi demand model comparison and spatio-temporal periodicity: https://www.nature.com/articles/s41598-022-07072-z
- UrbanFlow ML benchmark ladder and uncertainty: https://github.com/gbadedata/urbanflow-ml

## 9. تنفيذ هذا التكليف

- تم إنشاء Issue #51 وربط هذا المستند بها.
- تم إنشاء الفرع `agent/CHATGPT-1/FC-OSI-01` من `main`.
- هذا التغيير توثيقي فقط.
- اختبارات المنتج: NOT_REQUIRED لهذه الوثيقة.
- Git CLI / git diff --check: NOT_RUN في بيئة هذه المهمة.
- upstream builds/tests: NOT_RUN.
- لم تتم إضافة dependencies أو نسخ كود أو تشغيل خدمات أو إجراء اتصال بمنصات النقل.
- تم فتح PR #52 بحالة OPEN / DRAFT بعد اكتمال كتابة الوثيقة وفحص الملف المرفوع؛ المراجعة البشرية المستقلة والدمج ما زالا معلقين.


## 3.1 طبقة الذكاء المتقدم — خوارزميات إضافية (ALG-18 إلى ALG-52)

هذه الطبقة توسّع قدرات COMMANDER من تحليل العرض المفرد إلى فهم السياق، جودة الأدلة، المخاطر، وتوقيت القرار. **كل العناصر التالية PROPOSED وليست منفذة**. لا تعني كثرة الخوارزميات أن النظام أصبح أذكى تلقائياً؛ لا تُفعّل خوارزمية إلا إذا حسّنت نتيجة قابلة للقياس على بيانات مصرح بها، وتفوّقت على baseline، واجتازت اختبارات السلامة.

### A. موثوقية الأحداث وفهم العروض

| ID | الخوارزمية | الوظيفة | مخرج النظام | شرط التفعيل |
|---|---|---|---|---|
| ALG-18 | Event-time ordering + bounded lateness | ترتيب الأحداث بوقت الاستلام/المصدر مع تحمل محدود للتأخير | ترتيب قابل للتدقيق | لا نفترض ساعة منصة غير متاحة |
| ALG-19 | Idempotency keys + replay protection | منع معالجة الحدث نفسه مرتين | نتيجة معالجة واحدة | مفتاح موثوق أو fingerprint موثق |
| ALG-20 | Bayesian evidence update | تحديث قوة الدليل عند وصول حقول إضافية | evidence state مع prior معلن | لا يستخدم prior كحقيقة ولا يخفي UNKNOWN |
| ALG-21 | Selective classification / abstention | الامتناع عن التصنيف عند ضعف الدليل | CLASSIFIED أو ABSTAINED | عتبة معايرة على fixtures ممثلة |
| ALG-22 | Confidence calibration (isotonic / Platt) | معايرة درجات الثقة على نتائج موسومة | calibrated confidence | حجم بيانات كافٍ وفصل زمني |
| ALG-23 | Parser ensemble disagreement | كشف اختلاف محللات القوالب/القواعد | NEEDS_REVIEW | لا تصويت أغلبي يحوّل الخطأ إلى حقيقة |
| ALG-24 | Arabic normalization + locale-aware tokenization | تطبيع الأرقام والفواصل والمسافات وأشكال الحروف دون محو الأصل | normalized tokens + raw text reference | حفظ النص الخام محلياً بأقل مدة معتمدة |
| ALG-25 | Template drift detection | كشف تغير شكل الإشعار أو صياغته | TEMPLATE_CHANGED | لا يجرب تخمين قالب جديد تلقائياً |
| ALG-26 | Robust outlier detection (MAD / Hampel) | كشف قيم مسافة/زمن شاذة | OUTLIER_FLAG | لا يحذف القيمة الأصلية |
| ALG-27 | Change-point detection (CUSUM) | اكتشاف تغير مفاجئ في جودة المصدر أو سلوك القياسات | CHANGE_ALERT | نافذة كافية ومعدل إنذارات مضبوط |

### B. تقدير الوقت والرحلة والتكلفة التشغيلية

| ID | الخوارزمية | الوظيفة | مخرج النظام | شرط التفعيل |
|---|---|---|---|---|
| ALG-28 | ETA baseline ensemble | مقارنة route ETA مع median تاريخي/زمن ساعة-أسبوع | ETA range + provider | لا ازدحام حي دون traffic feed |
| ALG-29 | Quantile regression for ETA | تقدير P50/P80/P90 للوقت | نطاق وقت احتمالي | بيانات طريق محلية ومقاييس تغطية |
| ALG-30 | Conformal prediction intervals | نطاقات تنبؤ ذات تغطية قابلة للقياس | interval + empirical coverage | معايرة منفصلة وعدم تسرب المستقبل |
| ALG-31 | Deadhead/repositioning cost model | تقدير تكلفة الوصول للالتقاط/الانتقال | cost components | DEC-03/05/09 وأساس مسافة معتمد |
| ALG-32 | Robust speed profile | كشف سرعة غير منطقية من عينات مصرح بها | quality flag | DEC-10؛ لا مراقبة GPS قبل الموافقة |
| ALG-33 | Stop/idle segmentation (hysteresis) | فصل توقف/حركة لتلخيص الشيفت | segments | موافقة GPS وسياسة الاحتفاظ |
| ALG-34 | Route detour ratio | مقارنة المسار الفعلي بالمسار المرجعي | detour indicator | GPS مصرح به ومسار مرجعي صالح |
| ALG-35 | Multi-criteria route choice | موازنة الزمن/المسافة/الرسوم/عدم اليقين | ranked route alternatives | مزود موثوق وبيانات رسوم مثبتة |

### C. الطلب المكاني والزماني والفرص

| ID | الخوارزمية | الوظيفة | مخرج النظام | شرط التفعيل |
|---|---|---|---|---|
| ALG-36 | Spatio-temporal kernel smoothing | تنعيم إشارات المناطق المتجاورة زمنياً ومكانياً | smoothed proxy | لا يحول إشارات كابتن واحد إلى طلب سوق |
| ALG-37 | Empirical Bayes shrinkage | تقليل تطرف تقديرات المناطق قليلة العينات | stabilized estimate | مجموعة مرجعية ممثلة ومعلنة |
| ALG-38 | Hierarchical time-series forecasting | توقع هرمي: مدينة/منطقة/خلية | coherent forecasts | مصدر بيانات قانوني وتاريخ كافٍ |
| ALG-39 | Intermittent-demand Croston variants | خط أساس لإشارات نادرة ومتقطعة | demand baseline | تعريف الحدث ومعدل الرصد معروفان |
| ALG-40 | Negative-binomial regression | التعامل مع over-dispersion في العدّادات | count forecast | تشخيص التشتت يتفوق على Poisson |
| ALG-41 | Zero-inflated / hurdle models | فصل غياب الإشارة عن عملية العدّ | two-part forecast | صفر حقيقي وليس فشل جمع البيانات |
| ALG-42 | Spatial cross-validation | اختبار التعميم على مناطق لم تدخل التدريب | spatial holdout score | عدد مناطق كافٍ وتوزيع ممثل |
| ALG-43 | Spatio-temporal leakage audit | منع تسرب أحداث قريبة/لاحقة بين التدريب والاختبار | leakage report | سجل observation/availability time |
| ALG-44 | Opportunity-cost model | تقدير الفرص الضائعة عند الانتقال لمنطقة | opportunity penalty | outcomes موثوقة؛ لا أوزان تخمينية |
| ALG-45 | Contextual bandit — offline evaluation only | تقييم سياسات التوصية تاريخياً دون تنفيذ تجارب حية | offline policy value + uncertainty | propensity/logging صالحان؛ ممنوع exploration حي الآن |

### D. قرار COMMANDER، السلامة والتعلم

| ID | الخوارزمية | الوظيفة | مخرج النظام | شرط التفعيل |
|---|---|---|---|---|
| ALG-46 | Constrained optimization | تعظيم قيمة القرار ضمن قيود الوقت/الوقود/النطاق | feasible candidate set | القيود معتمدة ومعلنة |
| ALG-47 | Pareto frontier + dominance checks | عرض البدائل غير المهيمن عليها | Pareto alternatives | لا يختزل التفضيلات إلى وزن اعتباطي |
| ALG-48 | Counterfactual replay | مقارنة التوصية بما حدث فعلياً وما كان متاحاً وقتها | replay report | لا يدّعي معرفة رحلة لم تُعرض |
| ALG-49 | Doubly robust off-policy evaluation | تقييم سياسة ترتيب تاريخية مع تقليل انحياز الاختيار | policy estimate + CI | propensity scores وlogging صالحان |
| ALG-50 | Drift decomposition (data/concept/prediction) | فصل تغير المصدر عن تغير العلاقة عن تغير التوقع | drift diagnosis | بيانات مراقبة كافية |
| ALG-51 | Fault-tree + risk scoring | تحليل مسارات الفشل وتأثيرها على القرار | risk register | لا يستبدل مراجعة السلامة البشرية |
| ALG-52 | Explanation stability / sensitivity analysis | اختبار ثبات ترتيب العروض عند تغير مدخل صغير أو UNKNOWN | explanation + sensitivity | كل تغيير يظل قابلاً للتفسير ولا يخفي الحقول الناقصة |

### E. خوارزميات إضافية مؤجلة عمداً

هذه ليست فجوة يجب ملؤها فوراً؛ بل تقنيات لا تستحق التعقيد قبل وجود بيانات واختبارات:

- Graph neural networks للتنبؤ المكاني: مؤجلة حتى تثبت baselines البسيطة قصورها وتتوفر بيانات مكانية قانونية كثيفة.
- Deep reinforcement learning: مرفوض في الإصدار الحالي؛ قد يدفع إلى تجارب تشغيلية غير آمنة، ولا توجد بيئة محاكاة موثوقة.
- Real-time bidding / automated dispatch: خارج نطاق المنتج؛ لا Marketplace ولا قبول آلي.
- LSTM/Transformer forecasting: مؤجل حتى يثبت تفوقه على baselines عبر rolling-origin وspatial holdouts مع تكلفة تشغيل مقبولة.
- Federated learning: بحث مستقبلي فقط؛ لا توجد حالياً بنية موافقة/تجميع/تحديثات آمنة متعددة المستخدمين.
- Causal uplift / treatment-effect models: مؤجل حتى تتوفر بيانات تدخلات ونتائج مع تعريف واضح للسببية؛ الارتباط لا يثبت أثر التوصية.

### F. قواعد اختيار الخوارزمية — Intelligence Admission Gate

لا تدخل أي خوارزمية إلى المنتج إلا بعد اجتياز جميع البنود:

1. **Problem statement:** ما القرار الذي تحسنه؟ وما baseline الحالي؟
2. **Data contract:** مصدر كل حقل، وقت رصده، حق الاستخدام، النقص، وحدود الاحتفاظ.
3. **Deterministic fallback:** ماذا يعرض النظام إذا تعطل النموذج أو لم تتوفر البيانات؟
4. **Abstention:** متى يقول النظام «لا أعرف» بدلاً من تخمين النتيجة؟
5. **Evaluation:** holdout زمني/مكاني مناسب، ومقاييس مرتبطة بالقرار لا بالدقة العامة فقط.
6. **Calibration:** قياس موثوقية الثقة وفترات التنبؤ، لا مجرد score داخلي.
7. **Safety constraints:** لا قبول/رفض تلقائي، ولا تنفيذ أو تحكم خارجي.
8. **Explainability:** عرض أهم المدخلات والحقول المجهولة ومصدر التوصية.
9. **Resource budget:** زمن التنفيذ والذاكرة وحجم البيانات وحدود الشبكة والتكلفة.
10. **Rollback:** مفتاح تعطيل وإمكانية الرجوع إلى baseline دون فقد السجل.
11. **Privacy:** تقليل البيانات وعدم إرسال إشعارات أو مواقع دقيقة إلى مزود خارجي.
12. **Human acceptance:** مراجعة مستقلة واعتماد MOSAAB قبل التفعيل.

### G. ترتيب الذكاء المقترح حسب النضج

| المرحلة | ما يتعلمه COMMANDER | التقنيات المسموحة مبدئياً | بوابة النجاح |
|---|---|---|---|
| Intelligence-0 | فهم الإشعار وجودة البيانات | قواعد حتمية، تطبيع عربي، schema validation، dedupe | fixtures واقعية منزوعة الهوية |
| Intelligence-1 | فهم صلاحية العرض وسياقه | state machine، stale detection، selective abstention | لا عرض قديم على أنه حي |
| Intelligence-2 | مقارنة الرحلات | حسابات حتمية بعد اعتماد المال، route matrix بعد اعتماد المزود | نتائج قابلة لإعادة الحساب |
| Intelligence-3 | فهم المنطقة والوقت | H3، baselines، empirical Bayes، Poisson | مصدر بيانات وholdout محلي |
| Intelligence-4 | توقع عدم اليقين | quantile/conformal، calibration، drift | تغطية وانحياز منشوران |
| Intelligence-5 | تعلم جودة التوصية | replay، counterfactual، offline policy evaluation | نتائج متكررة على فترات ومناطق منفصلة |

**قاعدة نهائية:** الذكاء غير العادي في Fleet Commander لا يعني أكبر عدد من النماذج؛ بل يعني قراراً أفضل، في الوقت المناسب، مع دليل واضح، وامتناع صريح عند نقص البيانات، وعدم تجاوز سلطة الكابتن.
