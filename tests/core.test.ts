import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readDemoSession } from '../src/features/auth/demo-adapter.ts';
import { canEdit } from '../src/features/auth/model.ts';
import { filterEntries } from '../src/features/entries/model/filter-entries.ts';
import { entryInputSchema } from '../src/features/entries/model/schema.ts';
import { readListParams } from '../src/pages/entries/list-params.ts';
import { createHttpClient } from '../src/shared/api/http-client.ts';
import { ApiError } from '../src/shared/errors/app-error.ts';

describe('권한과 세션 경계', () => {
  it('관리자만 수정하며 손상된 저장값은 세션이 아니다', () => {
    assert.equal(
      canEdit({ id: 'demo-admin', name: '관리자', role: 'admin' }),
      true,
    );
    assert.equal(
      canEdit({ id: 'demo-viewer', name: '조회자', role: 'viewer' }),
      false,
    );
    assert.equal(canEdit(null), false);
    assert.equal(readDemoSession('{broken'), null);
    assert.equal(readDemoSession('{"role":"admin"}'), null);
    assert.equal(readDemoSession(null), null);
    assert.equal(
      readDemoSession(
        JSON.stringify({ id: 'demo-viewer', name: '조회자', role: 'viewer' }),
      )?.role,
      'viewer',
    );
  });
});
describe('목록 조건과 폼 검증', () => {
  it('URL의 잘못된 페이지와 필터를 기본값으로 정규화한다', () => {
    assert.deepEqual(
      readListParams(new URLSearchParams('page=-3&status=oops&sort=oops')),
      {
        page: 1,
        status: 'all',
        search: '',
        sort: 'newest',
      },
    );
    assert.equal(readListParams(new URLSearchParams('page=1.5')).page, 1);
    assert.equal(readListParams(new URLSearchParams('page=2')).page, 2);
  });
  it('검색과 상태를 함께 적용하고 전체 결과에서 정렬한다', () => {
    const rows = [
      {
        id: '1',
        title: '서비스 안내',
        category: '공지' as const,
        status: 'published' as const,
        description: '',
        author: '관리자',
        updatedAt: '2026-09-01',
      },
      {
        id: '2',
        title: '서비스 업데이트',
        category: '공지' as const,
        status: 'draft' as const,
        description: '',
        author: '관리자',
        updatedAt: '2026-09-02',
      },
    ];
    assert.deepEqual(
      filterEntries(rows, {
        page: 1,
        status: 'published',
        search: ' 서비스 ',
        sort: 'newest',
      }).map((x) => x.id),
      ['1'],
    );
    assert.deepEqual(
      filterEntries(rows, {
        page: 1,
        status: 'all',
        search: '',
        sort: 'newest',
      }).map((x) => x.id),
      ['2', '1'],
    );
    assert.deepEqual(
      rows.map((x) => x.id),
      ['1', '2'],
    );
    assert.equal(
      filterEntries(rows, {
        page: 1,
        status: 'all',
        search: '없음',
        sort: 'newest',
      }).length,
      0,
    );
  });
  it('공백 제목과 미정의 상태를 저장하지 않는다', () => {
    assert.equal(
      entryInputSchema.safeParse({
        title: ' ',
        category: '공지' as const,
        status: 'draft',
        description: '',
      }).success,
      false,
    );
    assert.equal(
      entryInputSchema.safeParse({
        title: '제목',
        category: '공지' as const,
        status: 'unknown',
        description: '',
      }).success,
      false,
    );
    assert.equal(
      entryInputSchema.parse({
        title: ' 제목 ',
        category: '공지' as const,
        status: 'draft',
        description: '',
      }).title,
      '제목',
    );
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
});

describe('경계 입력 추가 검증', () => {
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
        assert.equal(headers.get('TV'), 'demo');
        assert.equal(init?.body, '{"title":"test"}');
        assert.equal(init?.credentials, 'include');
        return new Response('{}');
      },
    });
    await request('/items', {
      method: 'POST',
      headers: { TV: 'demo' },
      body: '{"title":"test"}',
    });
  });
  it('상태와 정렬 값을 보존한다', () => {
    assert.equal(
      readListParams(new URLSearchParams('status=draft&sort=title')).status,
      'draft',
    );
    assert.equal(
      readListParams(new URLSearchParams('status=archived&sort=oldest')).sort,
      'oldest',
    );
    assert.equal(
      readDemoSession('{"id":"x","name":"관리자","role":"invalid"}'),
      null,
    );
    const rows = [
      {
        id: '1',
        title: '나',
        category: '공지' as const,
        status: 'draft' as const,
        description: '',
        author: '관리자',
        updatedAt: '2026-09-01',
      },
      {
        id: '2',
        title: '가',
        category: '공지' as const,
        status: 'draft' as const,
        description: '',
        author: '관리자',
        updatedAt: '2026-09-02',
      },
    ];
    assert.equal(
      filterEntries(rows, {
        page: 1,
        status: 'all',
        search: '',
        sort: 'oldest',
      })[0].id,
      '1',
    );
    assert.equal(
      filterEntries(rows, {
        page: 1,
        status: 'all',
        search: '',
        sort: 'title',
      })[0].id,
      '2',
    );
  });
});

describe('시간대가 다른 콘텐츠 정렬', () => {
  it('표시 문자열이 아닌 실제 시각으로 정렬한다', () => {
    const entries = [
      {
        id: 'old',
        title: '이전',
        category: '공지' as const,
        status: 'published' as const,
        description: '',
        author: '관리자',
        updatedAt: '2026-09-09T10:00:00+09:00',
      },
      {
        id: 'new',
        title: '최근',
        category: '공지' as const,
        status: 'published' as const,
        description: '',
        author: '관리자',
        updatedAt: '2026-09-09T02:00:00Z',
      },
    ];
    assert.equal(
      filterEntries(entries, {
        page: 1,
        status: 'all',
        search: '',
        sort: 'newest',
      })[0].id,
      'new',
    );
  });
});
