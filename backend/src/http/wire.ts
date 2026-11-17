import { DomainError, validation } from '../domain/errors.ts';
import type { ListOptions, Page } from '../domain/types.ts';

/**
 * طبقة تحويل HTTP بلا اعتماديات (FC-011 الزيادة 2): دوال نقية يستعملها معالج Fastify لاحقًا.
 * لا تعرف إطار عمل ولا الجلسة ولا شكل Money (O-06 مفتوح) ولا حقول الكيانات.
 * المصدر: OPENAPI_CORE_AR.yaml (PROPOSED، فرع session/05 غير المدمج).
 */

export type HeaderBag = Readonly<Record<string, string | readonly string[] | undefined>>;
export type QueryBag = Readonly<Record<string, unknown>>;

/** مطابق لـ components.schemas.Error.code. */
export type WireErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'RATE_LIMITED'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'PAYLOAD_TOO_LARGE'
  | 'INTERNAL';

export interface WireError {
  readonly code: WireErrorCode;
  readonly message: string;
  readonly request_id: string;
}

export interface ErrorResponse {
  readonly status: number;
  readonly body: WireError;
}

/**
 * رموز HTTP لرموز العقد غير النطاقية. 401/429 مذكوران في responses العقد؛
 * 413/415 هما المعتادان (INFERRED — لا نص في العقد)، و500 للخلل الداخلي.
 */
const WIRE_STATUS: Readonly<Record<Exclude<WireErrorCode, 'VALIDATION_FAILED' | 'NOT_FOUND' | 'CONFLICT' | 'IDEMPOTENCY_KEY_REUSED'>, number>> = {
  UNAUTHENTICATED: 401,
  RATE_LIMITED: 429,
  UNSUPPORTED_MEDIA_TYPE: 415,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL: 500,
};

/** رسالة ثابتة للأخطاء غير المتوقعة حتى لا تتسرب تفاصيل داخلية. */
const INTERNAL_MESSAGE = 'Internal error';

/** خطأ نطاقي ⇒ حالته من `httpHint`؛ أي شيء آخر ⇒ 500 INTERNAL بلا تسريب. */
export function errorResponse(err: unknown, requestId: string): ErrorResponse {
  if (err instanceof DomainError) {
    return { status: err.httpHint, body: { code: err.code, message: err.message, request_id: requestId } };
  }
  return { status: WIRE_STATUS.INTERNAL, body: { code: 'INTERNAL', message: INTERNAL_MESSAGE, request_id: requestId } };
}

/** أخطاء طبقة HTTP نفسها (جلسة، حدّ معدل، نوع محتوى، حجم). */
export function wireErrorResponse(
  code: keyof typeof WIRE_STATUS,
  message: string,
  requestId: string,
): ErrorResponse {
  const safe = code === 'INTERNAL' ? INTERNAL_MESSAGE : message;
  return { status: WIRE_STATUS[code], body: { code, message: safe, request_id: requestId } };
}

/**
 * `Idempotency-Key` إلزامي على العمليات المغيِّرة (parameters.IdempotencyKey.required = true).
 * الترويسة الناقصة أو المكرّرة أو الفارغة ⇒ VALIDATION_FAILED. طول 16..128 تفرضه النواة.
 * أسماء الترويسات غير حساسة لحالة الأحرف.
 */
export function idempotencyKeyFrom(headers: HeaderBag): string {
  let found: string | readonly string[] | undefined;
  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() === 'idempotency-key') {
      if (found !== undefined) throw validation('Idempotency-Key header must appear once');
      found = value;
    }
  }
  if (found === undefined) throw validation('Idempotency-Key header is required');
  if (typeof found !== 'string') throw validation('Idempotency-Key header must appear once');
  if (found.trim() === '') throw validation('Idempotency-Key header must not be empty');
  return found;
}

/**
 * معاملات القائمة: `limit` أرقام عشرية فقط (لا "5.0" ولا " 5" ولا "1e1")، و`cursor` نص.
 * النطاق 1..100 يفرضه `FleetService`؛ هنا التحويل من نص فقط. غياب المعامل ⇒ الافتراضي في النواة.
 */
export function listOptionsFrom(query: QueryBag): ListOptions {
  const out: { cursor?: string; limit?: number } = {};
  const limit = query['limit'];
  if (limit !== undefined) {
    if (typeof limit !== 'string' || !/^\d{1,9}$/.test(limit)) throw validation('limit must be a plain integer');
    out.limit = Number(limit);
  }
  const cursor = query['cursor'];
  if (cursor !== undefined) {
    if (typeof cursor !== 'string' || cursor === '') throw validation('cursor must be a non-empty string');
    out.cursor = cursor;
  }
  return out;
}

export interface WirePage<W> {
  readonly items: readonly W[];
  readonly next_cursor: string | null;
}

/** `nextCursor` (النواة) ⇒ `next_cursor` (العقد). الكيان يُحوَّل بدالة يمررها المستدعي (الشكل السلكي للكيانات خارج نطاق هذه الزيادة). */
export function toWirePage<T, W>(page: Page<T>, mapItem: (item: T) => W): WirePage<W> {
  return { items: page.items.map(mapItem), next_cursor: page.nextCursor };
}
