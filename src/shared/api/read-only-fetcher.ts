// UI/UX를 확정하기 전에는 변경 요청이 서버에 도달하지 않아야 한다. 개발용
// 서버가 없어 운영 데이터에 그대로 붙기 때문이다. 설정값으로 끄고 켜는 대신
// 쓰기 경로가 없는 fetcher를 주입해 능력 자체를 없앤다.
//
// POST이지만 조회인 API만 허용한다. 접두사가 아니라 정확히 같은 경로만
// 비교한다. `api/v1/admin/log/exclude/user`(제외 사용자 등록)는 변경이므로
// `api/v1/admin/log`(접속 로그 조회) 허용에 걸려들면 안 된다.
const READ_POST_PATHS = new Set([
  'oauth/token', // 로그인
  'api/v1/admin/log', // 사용자 접속 로그 조회
]);

function normalizePath(url: string) {
  const path = url.includes('://')
    ? new URL(url).pathname
    : url.split(/[?#]/)[0];
  return path.replace(/^\/+/, '').replace(/\/+$/, '');
}

export function isReadRequest(method: string, url: string) {
  const verb = method.toUpperCase();
  if (verb === 'GET' || verb === 'HEAD') return true;
  return verb === 'POST' && READ_POST_PATHS.has(normalizePath(url));
}

/**
 * 조회는 통과시키고 변경 요청은 보내기 전에 막는다. 막힌 요청은 저장 후
 * 화면 동작을 확인할 수 있도록 204로 응답한다. 서버 상태는 바뀌지 않으므로
 * 목록을 다시 불러와도 값은 그대로다.
 */
export function createReadOnlyFetcher(
  inner: typeof fetch = fetch,
): typeof fetch {
  return async function readOnlyFetch(input, init) {
    // Request 객체로 들어오면 method가 init이 아니라 객체에 있다. 여기서
    // 놓치면 POST가 GET으로 통과한다.
    const method =
      init?.method ?? (input instanceof Request ? input.method : 'GET');
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (isReadRequest(method, url)) return inner(input, init);
    console.warn(`변경 요청을 차단했습니다: ${method.toUpperCase()} ${url}`);
    return new Response(null, { status: 204 });
  };
}
