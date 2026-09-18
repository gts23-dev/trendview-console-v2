import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  mapUserSearchArticles,
  mapUserSearchEvents,
  mapUserSearchPlatforms,
  mapUserSearchTags,
} from '../src/features/user-stats/model/map-user-search.ts';
import {
  defaultUserSearchRange,
  parseUserSearchFilters,
  serializeUserSearchFilters,
} from '../src/features/user-stats/model/user-search.ts';
import {
  defaultRangeForUvPvChoice,
  formatUvPvDateLabel,
  parseUvPvFilters,
  serializeUvPvFilters,
} from '../src/features/user-stats/model/uv-pv.ts';
import {
  isMemberId,
  parseVisitorFilters,
  serializeVisitorFilters,
} from '../src/features/user-stats/model/visitors.ts';

describe('접속자 순위 조회 조건', () => {
  it('URL의 잘못된 값을 기본값으로 되돌린다', () => {
    const filters = parseVisitorFilters(
      new URLSearchParams('start=oops&sort=oops'),
    );
    assert.equal(filters.startDate, '');
    assert.equal(filters.sort, '');
  });
  it('구간을 지정하지 않으면 최근 30일을 기본값으로 채운다', () => {
    const filters = parseVisitorFilters(new URLSearchParams());
    assert.notEqual(filters.startDate, '');
    assert.notEqual(filters.endDate, '');
    assert.ok(filters.startDate < filters.endDate);
  });
  it('조건이 있으면 URL에 남겨 왕복해도 같은 값이 나온다', () => {
    const params = serializeVisitorFilters({
      startDate: '2026-01-01',
      endDate: '2026-09-01',
      sort: 'member',
    });
    assert.deepEqual(parseVisitorFilters(params), {
      startDate: '2026-01-01',
      endDate: '2026-09-01',
      sort: 'member',
    });
  });
  it('전체 정렬은 URL에 남기지 않는다', () => {
    const params = serializeVisitorFilters({
      startDate: '2026-01-01',
      endDate: '2026-09-01',
      sort: '',
    });
    assert.equal(params.get('sort'), null);
  });
});

describe('회원 아이디 판별', () => {
  it('36자리는 회원, 그 외는 비회원으로 본다', () => {
    assert.equal(isMemberId('123e4567-e89b-12d3-a456-426614174000'), true);
    assert.equal(isMemberId('guest-device-id'), false);
  });
});

describe('일간 사용자 유입량 조회 조건', () => {
  it('URL의 잘못된 값을 기본값으로 되돌린다', () => {
    const filters = parseUvPvFilters(new URLSearchParams('dateChoice=oops'));
    assert.equal(filters.dateChoice, 'daily');
  });
  it('구간 선택마다 기본 기간이 다르다', () => {
    const daily = defaultRangeForUvPvChoice('daily');
    const weekly = defaultRangeForUvPvChoice('weekly');
    const monthly = defaultRangeForUvPvChoice('monthly');
    assert.ok(daily.startDate > weekly.startDate);
    assert.ok(weekly.startDate > monthly.startDate);
  });
  it('기본 구간(daily)은 URL에 남기지 않는다', () => {
    const params = serializeUvPvFilters({
      dateChoice: 'daily',
      startDate: '2026-09-01',
      endDate: '2026-09-10',
    });
    assert.equal(params.get('dateChoice'), null);
  });
  it('바뀐 구간은 URL에 남겨 왕복해도 같은 값이 나온다', () => {
    const params = serializeUvPvFilters({
      dateChoice: 'weekly',
      startDate: '2026-06-01',
      endDate: '2026-09-01',
    });
    assert.deepEqual(parseUvPvFilters(params), {
      dateChoice: 'weekly',
      startDate: '2026-06-01',
      endDate: '2026-09-01',
    });
  });
});

describe('일간 사용자 유입량 날짜 라벨', () => {
  it('일간은 연도를 잘라 요일을 붙인다', () => {
    // 2026-09-13은 일요일이다.
    assert.equal(formatUvPvDateLabel('2026-09-13', 'daily'), '09-13(일)');
  });
  it('주간은 연도 네 자리만 잘라낸다', () => {
    assert.equal(formatUvPvDateLabel('2026-09-13', 'weekly'), '-09-13');
  });
  it('월간은 그대로 둔다', () => {
    assert.equal(formatUvPvDateLabel('2026-09', 'monthly'), '2026-09');
  });
});

describe('사용자 검색 조회 조건', () => {
  it('검색어가 없으면 빈 문자열로 본다', () => {
    const filters = parseUserSearchFilters(new URLSearchParams());
    assert.equal(filters.search, '');
  });
  it('구간을 지정하지 않으면 최근 30일을 기본값으로 채운다', () => {
    const filters = defaultUserSearchRange();
    assert.ok(filters.startDate < filters.endDate);
  });
  it('조건이 있으면 URL에 남겨 왕복해도 같은 값이 나온다', () => {
    const params = serializeUserSearchFilters({
      search: 'user-123',
      startDate: '2026-01-01',
      endDate: '2026-09-01',
    });
    assert.deepEqual(parseUserSearchFilters(params), {
      search: 'user-123',
      startDate: '2026-01-01',
      endDate: '2026-09-01',
    });
  });
  it('검색어가 없으면 URL에 남기지 않는다', () => {
    const params = serializeUserSearchFilters({
      search: '',
      startDate: '2026-01-01',
      endDate: '2026-09-01',
    });
    assert.equal(params.get('search'), null);
  });
});

describe('사용자 검색 이벤트·플랫폼 집계', () => {
  it('빠진 이벤트는 0으로 채우고 고정된 순서로 보여준다', () => {
    const events = mapUserSearchEvents([
      { key: 'like', count: 3 },
      { key: 'visit', count: 10 },
    ]);
    assert.deepEqual(
      events.map((item) => item.event),
      ['visit', 'click', 'like', 'favorite'],
    );
    assert.equal(events[0].count, 10);
    assert.equal(events[1].count, 0);
  });
  it('빠진 플랫폼은 0으로 채우고 고정된 순서로 보여준다', () => {
    const platforms = mapUserSearchPlatforms([{ key: 'youtube', count: 5 }]);
    assert.deepEqual(
      platforms.map((item) => item.platform),
      ['instagram', 'naver-blog', 'google-news', 'youtube', 'twitter'],
    );
    assert.equal(platforms[3].count, 5);
    assert.equal(platforms[0].count, 0);
  });
});

describe('사용자 검색 콘텐츠·키워드 순위', () => {
  it('제목이 있으면 제목을, 없으면 본문을 60자까지 보여준다', () => {
    const articles = mapUserSearchArticles([
      {
        articleId: 1,
        count: 5,
        articleData: { platform: 'youtube', title: '제목', contents: null },
      },
      {
        articleId: 2,
        count: 3,
        articleData: { platform: 'instagram', title: '', contents: '본문' },
      },
    ]);
    assert.equal(articles[0].rank, 1);
    assert.equal(articles[0].text, '제목');
    assert.equal(articles[1].text, '본문');
  });
  it('article_data가 없으면 아이디를 그대로 보여주고 플랫폼은 모른다', () => {
    const articles = mapUserSearchArticles([
      { articleId: 42, count: 1, articleData: null },
    ]);
    assert.equal(articles[0].text, '42');
    assert.equal(articles[0].platform, null);
  });
  it('태그 순위는 순서대로 번호를 매긴다', () => {
    const tags = mapUserSearchTags([
      { tag: 'a', count: 5 },
      { tag: 'b', count: 3 },
    ]);
    assert.deepEqual(
      tags.map((item) => item.rank),
      [1, 2],
    );
  });
});
