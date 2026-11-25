/** أسماء الرموز مطابقة لـ components.schemas.Error.code في OPENAPI_CORE_AR.yaml (PROPOSED). */
export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'IDEMPOTENCY_KEY_REUSED';

/** تلميح لرمز HTTP يستخدمه طبقة الواجهة لاحقًا؛ النواة نفسها لا تعرف HTTP. */
const HTTP_HINT: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 422,
  CONFLICT: 409,
  NOT_FOUND: 404,
  IDEMPOTENCY_KEY_REUSED: 409, // العقد: responses.Conflict = «Conflict or idempotency mismatch»
};

export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly httpHint: number;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.httpHint = HTTP_HINT[code];
  }
}

export function validation(message: string): DomainError {
  return new DomainError('VALIDATION_FAILED', message);
}
export function conflict(message: string): DomainError {
  return new DomainError('CONFLICT', message);
}
export function notFound(message: string): DomainError {
  return new DomainError('NOT_FOUND', message);
}
