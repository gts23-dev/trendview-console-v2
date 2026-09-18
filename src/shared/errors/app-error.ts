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
    /**
     * 서버가 준 실패 사유. 사용자에게 보여주지 않고 진단 로그에만 남긴다.
     * 응답 본문을 통째로 남기면 자격 증명까지 콘솔에 남으므로 문구만 담는다.
     */
    readonly detail?: string,
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
