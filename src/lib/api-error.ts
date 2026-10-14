import { type FieldError, isProblem, type ProblemDetails } from '@bandada/contracts-ts';
import { errorMessage, type Locale } from '@bandada/i18n';

/** Normalized client error derived from RFC 9457 Problem Details. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly title: string;
  readonly detail?: string;
  readonly traceId?: string;
  readonly fields?: FieldError[];

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
    this.name = 'ApiError';
    this.status = problem.status;
    this.code = problem.code;
    this.title = problem.title;
    this.detail = problem.detail;
    this.traceId = problem.traceId;
    this.fields = problem.errors;
  }

  /** Localized (ICU) message for the stable `code`. */
  localizedMessage(locale: Locale): string {
    return errorMessage(this.code, locale);
  }

  static fromUnknown(status: number, body: unknown): ApiError {
    if (isProblem(body)) return new ApiError(body);
    return new ApiError({
      type: 'about:blank',
      title: `HTTP ${status}`,
      status,
      code: 'INTERNAL_ERROR',
    });
  }
}

export function isApiErrorWithCode(error: unknown, code: string): error is ApiError {
  return error instanceof ApiError && error.code === code;
}
