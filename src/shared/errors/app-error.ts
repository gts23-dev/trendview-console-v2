// message에는 사용자에게 표시해도 되는 문구만 넣는다.
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ApiError extends AppError {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message, 'HTTP_ERROR');
    this.name = 'ApiError';
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof AppError
    ? error.message
    : '요청을 처리하지 못했습니다. 다시 시도해 주세요.';
}
