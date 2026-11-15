export type ErrorCode =
  | 'VALIDATION'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'IDEMPOTENCY_MISMATCH';

/** تلميح لرمز HTTP يستخدمه طبقة الواجهة لاحقًا؛ النواة نفسها لا تعرف HTTP. */
const HTTP_HINT: Record<ErrorCode, number> = {
  VALIDATION: 422,
  CONFLICT: 409,
  NOT_FOUND: 404,
  IDEMPOTENCY_MISMATCH: 422,
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
  return new DomainError('VALIDATION', message);
}
export function conflict(message: string): DomainError {
  return new DomainError('CONFLICT', message);
}
export function notFound(message: string): DomainError {
  return new DomainError('NOT_FOUND', message);
}
