import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  pageUsers,
  parseUserFilters,
  serializeUserFilters,
  USER_PAGE_SIZE,
} from '../src/features/users/model/filters.ts';
import { mapUser } from '../src/features/users/model/map-user.ts';

describe('사용자 응답 변환', () => {
  it('이름·이메일·소속 매체를 화면 값으로 바꾼다', () => {
    assert.deepEqual(
      mapUser({
        id: 7,
        name: '테스트',
        email: 'test@example.com',
        user_media: [
          { id: 1, name: '매체 가' },
          { id: 2, name: '매체 나' },
        ],
      }),
      {
        id: 7,
        name: '테스트',
        email: 'test@example.com',
        medias: [
          { id: 1, name: '매체 가' },
          { id: 2, name: '매체 나' },
        ],
      },
    );
  });

  it('빈 값은 빈 문자열과 빈 매체 목록으로 둔다', () => {
    assert.deepEqual(
      mapUser({ id: 7, name: null, email: null, user_media: null }),
      { id: 7, name: '', email: '', medias: [] },
    );
    assert.deepEqual(
      mapUser({ id: 8, user_media: [{ id: 1, name: null }] }).medias,
      [{ id: 1, name: '' }],
    );
  });
});

describe('사용자 목록 조건', () => {
  it('URL의 쪽과 검색어를 읽는다', () => {
    assert.deepEqual(
      parseUserFilters(new URLSearchParams('page=2&search=%20테스트%20')),
      { page: 2, search: '테스트' },
    );
  });

  it('잘못된 쪽 번호는 1로 돌린다', () => {
    for (const page of ['0', '-1', 'abc', '1.5']) {
      assert.equal(
        parseUserFilters(new URLSearchParams({ page })).page,
        1,
        page,
      );
    }
  });

  it('기본값은 URL에서 지우고 다른 값은 그대로 둔다', () => {
    const params = serializeUserFilters(
      { page: 1, search: '' },
      new URLSearchParams('media=3&page=2&search=이전'),
    );
    assert.equal(params.toString(), 'media=3');
    assert.equal(
      serializeUserFilters({ page: 3, search: '테스트' }).toString(),
      `page=3&search=${encodeURIComponent('테스트')}`,
    );
  });
});

describe('사용자 목록 쪽 나누기', () => {
  const users = Array.from({ length: USER_PAGE_SIZE + 3 }, (_, index) => index);

  it('서버가 준 전체 목록에서 해당 쪽만 자른다', () => {
    assert.deepEqual(pageUsers(users, 1), users.slice(0, USER_PAGE_SIZE));
    assert.deepEqual(pageUsers(users, 2), users.slice(USER_PAGE_SIZE));
  });

  it('범위를 넘은 쪽은 비어 있다', () => {
    assert.deepEqual(pageUsers(users, 3), []);
  });
});
