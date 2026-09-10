import { ApiError } from '@/shared/errors/app-error';

interface ClientOptions {
  baseUrl: string;
  getHeaders?: () => HeadersInit;
  fetcher?: typeof fetch;
  credentials?: RequestCredentials;
}
// 응답 envelope 및 인증 방식은 서비스별 adapter에서 결정한다.
export function createHttpClient({
  baseUrl,
  getHeaders,
  fetcher = fetch,
  credentials = 'same-origin',
}: ClientOptions) {
  return async function request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    if (
      /^[a-z][a-z0-9+.-]*:/i.test(path) ||
      path.startsWith('//') ||
      path.includes('\\')
    )
      throw new Error('API에는 상대 경로만 사용할 수 있습니다.');
    const headers = new Headers(getHeaders?.());
    headers.set('Accept', 'application/json');
    if (typeof options.body === 'string')
      headers.set('Content-Type', 'application/json');
    new Headers(options.headers).forEach((value, key) =>
      headers.set(key, value),
    );
    let response: Response;
    try {
      response = await fetcher(
        `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
        {
          ...options,
          credentials,
          headers,
        },
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError')
        throw error;
      throw new ApiError('네트워크 연결을 확인해 주세요.', 0);
    }
    if (!response.ok)
      throw new ApiError(
        response.status === 401
          ? '로그인이 필요합니다.'
          : response.status === 403
            ? '접근 권한이 없습니다.'
            : '요청을 처리하지 못했습니다.',
        response.status,
      );
    if (response.status === 204) return undefined as T;
    try {
      return (await response.json()) as T;
    } catch {
      throw new ApiError('서버 응답 형식을 확인해 주세요.', response.status);
    }
  };
}
