# عقد مزود النموذج اللغوي (LlmProvider) — PROPOSED

مرجع الكود: `backend/src/ai/contracts.ts`. هذا العقد هو كل ما يحتاجه من ينفذ محوّلًا لمزود جديد.

## 1. الواجهة
```ts
interface LlmProvider {
  readonly id: string;                       // مثل "provider-a"، فريد، يُكتب في الإعدادات
  readonly capabilities: { json: boolean; maxContextTokens: number };
  complete(
    req: { messages; maxOutputTokens; responseFormat: 'text' | 'json' },
    signal: AbortSignal,
  ): Promise<{ text; finishReason: 'stop'|'length'|'content_filter';
               usage: { inputTokens; outputTokens }; model: string }>;
}
```

## 2. الالتزامات
1. **المهلة:** يحترم `signal`؛ عند الإلغاء يتوقف فورًا. المهلة يديرها الـGateway لا المحوّل.
2. **لا إعادة محاولة داخلية.** القرار للـGateway.
3. **ترجمة الأخطاء** إلى `LlmError` فقط، ولا يمرر نص رد المزود أو المفتاح أو الـURL في الرسالة:

| ما يحدث عند المزود (INFERRED، عام) | الرمز |
|---|---|
| 400 / طلب مرفوض لشكل الإدخال | BAD_REQUEST |
| 401 / 403 مصادقة | AUTH_FAILED |
| 429 | RATE_LIMITED |
| 5xx / انقطاع / DNS / إعادة ضبط الاتصال | PROVIDER_UNAVAILABLE |
| مهلة المنقل الداخلية | TIMEOUT |
| فلترة محتوى | يعيد `finishReason: 'content_filter'` |

4. `usage` إلزامي. إذا لم يعده المزود، المحوّل يقدّره (حرف ÷ 2 تقريبًا للعربية) ويسجّل ذلك في وثيقة المحوّل.
5. `responseFormat: 'json'` ⇒ `capabilities.json = true` أو المحوّل غير مؤهل لذلك الطلب (يتخطاه الـGateway).
6. لا تسجيل للمحتوى، لا كاش للمحتوى، لا تخزين محادثات.
7. المفتاح من متغير بيئة يُقرأ داخل المحوّل عند الإنشاء؛ غيابه ⇒ يفشل الإنشاء بخطأ واضح ولا يُسجَّل المفتاح.

## 3. اختبارات التوافق (يجب أن ينجح فيها أي محوّل قبل أي تفعيل)
تعمل على استجابات مسجلة (mock transport) بلا شبكة، ثم مرة واحدة حية بموافقة MOSAAB.
1. نجاح نصي: يعيد text وusage وmodel.
2. نجاح JSON: النص قابل للتحليل.
3. 401 ⇒ AUTH_FAILED، والرسالة لا تحوي المفتاح.
4. 429 ⇒ RATE_LIMITED.
5. 500 وانقطاع ⇒ PROVIDER_UNAVAILABLE.
6. إلغاء `signal` ⇒ يتوقف خلال 100ms ولا يترك طلبًا معلقًا.
7. فلترة ⇒ `finishReason: 'content_filter'`.
8. كل رسالة خطأ لا تحوي نص الطلب ولا الرد.
9. `maxOutputTokens` يُمرَّر للمزود كما هو.
10. لا اتصال شبكة عند الإنشاء (فقط عند `complete`).

## 4. إضافة مزود
1. محوّل واحد في `backend/src/ai/providers/<id>.ts` ينفذ الواجهة، بلا تبعيات إلا لو أُقرّت.
2. تسجيله في خريطة المزودين عند الإقلاع (ليس في الـGateway).
3. إضافة معرّفه إلى `purposes.<purpose>.providers` في الإعداد، بعد موافقة MOSAAB (G8).
4. وثيقة قصيرة: النموذج المستخدم، حدود الاستخدام، سياسة بيانات المزود، التكلفة (إن وجدت) — كلها بمصدر رسمي ومؤرخة.

## 5. ما يوفره الـGateway للمحوّل (لا يكرره)
التحقق، التنقيح، الميزانية، المهلة الكلية، الفحص الأخير للناتج (فارغ/JSON)، الدائرة، التدقيق.
