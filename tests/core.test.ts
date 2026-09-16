import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { isAdminGrade } from '../src/features/auth/model.ts';
import {
  getMediaCode,
  mediaHeaders,
} from '../src/features/medias/model/media-codes.ts';
import { pickMediaId } from '../src/features/medias/model/media-scope.ts';
import { parseStorageUrls } from '../src/features/medias/model/storage-urls.ts';
import { createHttpClient } from '../src/shared/api/http-client.ts';
import {
  createReadOnlyFetcher,
  isReadRequest,
} from '../src/shared/api/read-only-fetcher.ts';
import { ApiError } from '../src/shared/errors/app-error.ts';
import { joinUrl } from '../src/shared/utils/url.ts';

const SESSION = {
  id: '1',
  name: '운영자',
  email: 'operator@example.com',
  grade: 0,
  medias: [
    { id: 5, name: '컬쳐랜드' },
    { id: 3, name: '영화' },
  ],
};

describe('권한 판단', () => {
  it('등급 0만 일반 운영자로 보고 나머지는 관리자로 본다', () => {
    assert.equal(isAdminGrade(null), false);
    assert.equal(isAdminGrade(SESSION), false);
    assert.equal(isAdminGrade({ ...SESSION, grade: 1 }), true);
    assert.equal(isAdminGrade({ ...SESSION, grade: 9 }), true);
  });
});

describe('전역 매체 범위', () => {
  it('URL을 가장 먼저 쓰고 저장값, 첫 매체 순으로 되돌린다', () => {
    assert.equal(pickMediaId('3', '5', SESSION.medias), 3);
    assert.equal(pickMediaId(null, '3', SESSION.medias), 3);
    assert.equal(pickMediaId(null, null, SESSION.medias), 5);
  });
  it('볼 수 없는 매체는 URL이든 저장값이든 버린다', () => {
    // 권한이 바뀌어 접근할 수 없게 된 매체가 저장돼 있을 수 있다.
    assert.equal(pickMediaId('99', null, SESSION.medias), 5);
    assert.equal(pickMediaId(null, '99', SESSION.medias), 5);
    assert.equal(pickMediaId('oops', '1.5', SESSION.medias), 5);
    assert.equal(pickMediaId('', '', SESSION.medias), 5);
  });
  it('볼 수 있는 매체가 없으면 범위를 정하지 않는다', () => {
    assert.equal(pickMediaId('3', '5', []), null);
  });
});

describe('매체 코드와 스토리지 URL', () => {
  it('매체 id를 서버가 요구하는 TV 헤더 값으로 바꾼다', () => {
    assert.equal(getMediaCode(5), 'cultureland');
    assert.equal(getMediaCode(999), '');
    assert.deepEqual(mediaHeaders(3), { TV: 'movie' });
    // 모르는 매체에 빈 헤더를 보내지 않는다.
    assert.deepEqual(mediaHeaders(999), {});
  });
  it('환경변수의 스토리지 URL은 형식을 검증한 뒤 사용한다', () => {
    assert.deepEqual(parseStorageUrls(undefined), {});
    assert.deepEqual(parseStorageUrls('{broken'), {});
    assert.deepEqual(parseStorageUrls('{"main":"not-a-url"}'), {});
    assert.deepEqual(parseStorageUrls('{"main":"https://cdn.test/a/"}'), {
      main: 'https://cdn.test/a/',
    });
  });
  it('기준 URL과 상대 경로를 슬래시 중복 없이 합친다', () => {
    assert.equal(
      joinUrl('https://cdn.test/a/', '/x/y.jpg'),
      'https://cdn.test/a/x/y.jpg',
    );
    assert.equal(
      joinUrl('https://cdn.test/a', 'x.jpg'),
      'https://cdn.test/a/x.jpg',
    );
    assert.equal(joinUrl('', 'x.jpg'), '');
    assert.equal(joinUrl('https://cdn.test/a', ''), '');
  });
});

describe('변경 요청 차단', () => {
  it('조회만 통과시키고 읽기용 POST는 정확히 같은 경로만 허용한다', () => {
    assert.equal(isReadRequest('GET', 'api/v1/admin/articles?page=1'), true);
    assert.equal(isReadRequest('head', '/api/v1/medias'), true);
    assert.equal(isReadRequest('POST', 'oauth/token'), true);
    assert.equal(isReadRequest('POST', '/api/v1/admin/log'), true);
    // 접두사로 비교하면 제외 사용자 등록이 조회로 통과해 버린다.
    assert.equal(isReadRequest('POST', 'api/v1/admin/log/exclude/user'), false);
    assert.equal(isReadRequest('POST', 'api/v1/admin/article/scrap'), false);
    assert.equal(isReadRequest('PUT', 'api/v1/articles'), false);
    assert.equal(isReadRequest('DELETE', 'api/v1/articles/delete'), false);
    // 절대 URL과 쿼리·해시가 붙은 경로도 같은 기준으로 판단한다.
    assert.equal(isReadRequest('POST', 'https://api.test/oauth/token'), true);
    assert.equal(isReadRequest('POST', '/api/v1/admin/log/?x=1'), true);
    assert.equal(isReadRequest('POST', 'https://api.test/api/v1/users'), false);
  });
  it('URL 객체와 Request 객체로 들어온 요청도 검사한다', async () => {
    const warn = mock.method(console, 'warn', () => {});
    const sent: string[] = [];
    const fetcher = createReadOnlyFetcher(async (input) => {
      sent.push(input instanceof Request ? input.url : String(input));
      return new Response('{}');
    });
    try {
      await fetcher(new URL('https://api.test/api/v1/medias'));
      const blocked = await fetcher(
        new Request('https://api.test/api/v1/users', { method: 'POST' }),
      );
      assert.equal(blocked.status, 204);
      assert.deepEqual(sent, ['https://api.test/api/v1/medias']);
    } finally {
      warn.mock.restore();
    }
  });
  it('막은 요청은 전송하지 않고 화면 동작을 위해 204로 답한다', async () => {
    const warn = mock.method(console, 'warn', () => {});
    const sent: string[] = [];
    const fetcher = createReadOnlyFetcher(async (input, init) => {
      sent.push(`${init?.method ?? 'GET'} ${String(input)}`);
      return new Response('{}');
    });
    try {
      const blocked = await fetcher('https://api.test/api/v1/articles', {
        method: 'PUT',
      });
      assert.equal(blocked.status, 204);
      assert.deepEqual(sent, []);
      assert.equal(warn.mock.callCount(), 1);
      await fetcher('https://api.test/api/v1/medias');
      assert.deepEqual(sent, ['GET https://api.test/api/v1/medias']);
    } finally {
      warn.mock.restore();
    }
  });
  it('막힌 변경 요청은 http client에서 빈 응답이 된다', async () => {
    const warn = mock.method(console, 'warn', () => {});
    try {
      const request = createHttpClient({
        baseUrl: 'https://api.test',
        fetcher: createReadOnlyFetcher(async () => {
          throw new Error('전송되면 안 됨');
        }),
      });
      assert.equal(
        await request('api/v1/articles', {
          method: 'PUT',
          body: '{"state":1}',
        }),
        undefined,
      );
    } finally {
      warn.mock.restore();
    }
  });
});

describe('HTTP 연결부', () => {
  it('인증 헤더를 주입하고 응답 포맷은 그대로 반환한다', async () => {
    let called = false;
    const request = createHttpClient({
      baseUrl: 'https://example.test/api/',
      getHeaders: () => ({ Authorization: 'Bearer demo' }),
      fetcher: async (url, init) => {
        called = true;
        assert.equal(String(url), 'https://example.test/api/items');
        assert.equal(
          new Headers(init?.headers).get('Authorization'),
          'Bearer demo',
        );
        return new Response(JSON.stringify({ data: [1] }));
      },
    });
    assert.deepEqual(await request('/items'), { data: [1] });
    assert.equal(called, true);
  });
  it('204, HTTP 오류, 잘못된 JSON과 취소를 구별한다', async () => {
    const empty = createHttpClient({
      baseUrl: '/api',
      fetcher: async () => new Response(null, { status: 204 }),
    });
    assert.equal(await empty('/items'), undefined);
    const fail = createHttpClient({
      baseUrl: '/api',
      fetcher: async () => new Response('private', { status: 403 }),
    });
    await assert.rejects(
      fail('/items'),
      (e: unknown) =>
        e instanceof ApiError &&
        e.status === 403 &&
        !e.message.includes('private'),
    );
    const invalid = createHttpClient({
      baseUrl: '/api',
      fetcher: async () => new Response('not-json'),
    });
    await assert.rejects(invalid('/items'), /응답 형식/);
    const cancel = createHttpClient({
      baseUrl: '/api',
      fetcher: async () => {
        throw new DOMException('cancel', 'AbortError');
      },
    });
    await assert.rejects(
      cancel('/items'),
      (e: unknown) => e instanceof DOMException && e.name === 'AbortError',
    );
  });
  it('다른 origin으로 인증을 보내는 경로는 허용하지 않는다', async () => {
    const request = createHttpClient({
      baseUrl: '/api',
      fetcher: async () => {
        throw new Error('호출되면 안 됨');
      },
    });
    await assert.rejects(request('https://outside.test'), /상대 경로/);
    await assert.rejects(request('//outside.test'), /상대 경로/);
  });
  it('네트워크 오류와 401/500 상태를 전달한다', async () => {
    const offline = createHttpClient({
      baseUrl: '/api',
      fetcher: async () => {
        throw new TypeError('offline');
      },
    });
    await assert.rejects(
      offline('/items'),
      (e: unknown) => e instanceof ApiError && e.status === 0,
    );
    for (const status of [401, 500]) {
      const request = createHttpClient({
        baseUrl: '/api',
        fetcher: async () => new Response(null, { status }),
      });
      await assert.rejects(
        request('/items'),
        (e: unknown) => e instanceof ApiError && e.status === status,
      );
    }
  });
  it('요청별 헤더, JSON body와 쿠키 옵션을 보존한다', async () => {
    const request = createHttpClient({
      baseUrl: '/api',
      credentials: 'include',
      fetcher: async (_url, init) => {
        const headers = new Headers(init?.headers);
        assert.equal(headers.get('Content-Type'), 'application/json');
        assert.equal(headers.get('TV'), 'movie');
        assert.equal(init?.body, '{"title":"test"}');
        assert.equal(init?.credentials, 'include');
        return new Response('{}');
      },
    });
    await request('/items', {
      method: 'POST',
      headers: mediaHeaders(3),
      body: '{"title":"test"}',
    });
  });
});
