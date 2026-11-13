# مصفوفة نطاق الخوارزميات — A0-25 / A0-28

- الحالة: PROPOSED — بانتظار DEC-17
- الجلسة: 01
- المرجع: Master Plan v1.0 §10–15 + `CAPTAIN_INTELLIGENCE_ALGORITHMS_AR.md`
- ملاحظة توفيق: كتالوج الخوارزميات القديم يضع ALG-02/03/04 في D2؛ الخطة الرئيسية v1.0 تضعها في D3. **تعتمد هذه المصفوفة ترتيب v1.0** (الأحدث) لحين قرار المدير.

| ALG | الاسم | المرحلة | MVP؟ | البيانات المطلوبة | الأساس (Baseline) | Cold Start | التقييم |
|---|---|---|---|---|---|---|---|
| ALG-01 | Personal Baseline | D2 | نعم | DS-01..03 | متوسط/وسيط تاريخي | يُعرض UNKNOWN إن العينة < حد يعتمد لاحقًا | مطابقة مع SQL |
| ALG-07 | Data Quality & Anomaly | D2 | نعم | DS-01..03 | قواعد حتمية | — | حالات اختبار |
| ALG-11 | Personal H3 Aggregation | D2 | نعم (بشرط DEC-10) | منطقة لكل رحلة | عدّ/متوسط | منطقة بلا عينة كافية | مطابقة |
| ALG-16 | Historical Replay | D2 | نعم | سجل تاريخي | — | — | تقسيم زمني |
| ALG-02 | ETA | D3 | لا | DS-06 | ETA المزود | بلا مزود → UNKNOWN | MAE/Bias |
| ALG-03 | Spatio-Temporal Forecast | D3 | لا | تاريخ منطقة×وقت | Seasonal Naive/Rolling Median | كشف Cold Start | Interval Coverage |
| ALG-04 | Opportunity Scoring | D3 | لا | قواعد مال معتمدة | معادلة شفافة | | بعد G3 فقط |
| ALG-09 | Road Graph | D3 | لا | DS-07 | — | | |
| ALG-10 | Destination Rec. | D3 | لا | | | | |
| ALG-12 | Authorized Supply/Demand | D3 | لا | DS-08 غير متاح | — | | محجوب |
| ALG-13 | Surge & Incentive Eval. | D3 | جزئي | DS-10 يدوي | مقارنة معلنة | | |
| ALG-05 | Next Best Area | D3 (Repositioning) | لا | ALG-03 + تكلفة انتقال | البقاء مقابل الانتقال | | Shadow Mode |
| ALG-06 | Shift Planner | D3 | لا | تفضيلات + تاريخ | سيناريوهات 3 | | |
| ALG-14 | Pickup/Dropoff Quality | D3 لاحقًا | لا | | | | |
| ALG-15 | Multi-stop Planner | مؤجل | لا | | | | |
| ALG-08 | Adaptive Learning | D6 | لا | بيانات طويلة | | | خارج العينة + موافقة |
| ALG-17 | Goal/Incentive Optimizer | D6 | لا | | | | |

## قواعد
1. ممنوع إعلان نجاح خوارزمية دون Baseline واختبار خارج العينة ومنع تسرب المستقبل (Temporal split).
2. لا نقل لأرقام DiDi (فواصل الخمول وإعادة التقييم) إلى مصر دون معايرة محلية.
3. لا Deep RL قبل بيانات كافية وموافقة.
4. «حد العينة الأدنى» غير محدد عمدًا — يُحدد من بيانات فعلية في D2 (UNKNOWN).
