// HTTP 전송에 필요한 bearer token만 보관한다. 세션 정보와 권한 판단은
// features/auth가 가진다.
const KEY = 'trendview.access-token';

export function readAccessToken() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function writeAccessToken(token: string) {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    // 저장소를 쓸 수 없으면 현재 탭에서만 인증이 유지된다.
  }
}

export function clearAccessToken() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 지울 수 없어도 세션은 메모리에서 비운다.
  }
}
