import { ApiError } from '@/shared/errors/app-error';
import { logger } from '@/shared/logger/logger';
import { clearAccessToken, readAccessToken } from './access-token';
import { createHttpClient } from './http-client';
import { createReadOnlyFetcher } from './read-only-fetcher';

/** 토큰이 만료되면 이 이벤트로 한 곳에서만 세션을 비운다. */
export const UNAUTHORIZED_EVENT = 'trendview:unauthorized';

// 개발과 운영 모두 이 주소로 직접 호출한다. 비어 있으면 설정 누락이다.
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
if (!baseUrl)
  logger.error('VITE_API_BASE_URL이 없습니다.', {
    code: 'MISSING_API_BASE_URL',
  });

const send = createHttpClient({
  baseUrl,
  getHeaders: (): HeadersInit => {
    const token = readAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
  // 변경 요청을 막는 지점이다. Phase 5에서 이 옵션을 제거하면 쓰기가 열린다.
  fetcher: createReadOnlyFetcher(),
});

export async function request<T>(path: string, options?: RequestInit) {
  try {
    return await send<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      // 어떤 요청이 거부됐는지 남긴다. 이게 없으면 로그인 화면으로 튕긴 뒤에
      // 원인을 되짚을 수 없다.
      logger.warn(`인증이 거부되었습니다: ${path}`, { status: 401 });
      // 호출부가 Authorization을 직접 넘겼다면 그 요청은 세션 토큰을 쓰지
      // 않았다. 그 401로 세션을 비우면 화면 하나 때문에 로그아웃되고, 로그인
      // 후 같은 화면으로 돌아와 다시 401이 나면서 무한 왕복한다.
      if (!new Headers(options?.headers).has('Authorization')) {
        clearAccessToken();
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      }
    }
    throw error;
  }
}
