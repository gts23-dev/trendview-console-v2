import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  defaultRangeForRankChoice,
  formatBucketLabel,
  getWeekdayLabel,
  parseContentRankFilters,
  serializeContentRankFilters,
} from '../src/features/article-stats/model/content-ranks.ts';
import {
  countDailyPages,
  getActiveLabels,
  parseCountsFilters,
  serializeCountsFilters,
} from '../src/features/article-stats/model/counts.ts';
import {
  mapContentRankBucket,
  normalizeRankSlots,
} from '../src/features/article-stats/model/map-content-rank.ts';
import { mapDailyPlatformCount } from '../src/features/article-stats/model/map-daily.ts';
import { orderPlatformCounts } from '../src/features/article-stats/model/platforms.ts';

describe('수집/게시/신고 개수 조회 조건', () => {
  it('URL의 잘못된 값을 기본값으로 되돌린다', () => {
    const filters = parseCountsFilters(
      new URLSearchParams('state=9&choice=oops'),
    );
    assert.equal(filters.state, 0);
    assert.equal(filters.dateChoice, 'daily');
  });
  it('구간을 지정하지 않으면 최근 30일과 오늘을 기본값으로 채운다', () => {
    const filters = parseCountsFilters(new URLSearchParams());
    assert.notEqual(filters.startDate, '');
    assert.ok(filters.startDate < filters.endDate);
    assert.equal(filters.activeStartDate, filters.activeEndDate);
  });
  it('기본값(수집·일간)은 URL에 남기지 않는다', () => {
    const params = serializeCountsFilters({
      state: 0,
      page: 1,
      startDate: '2026-01-01',
      endDate: '2026-09-01',
      dateChoice: 'daily',
      activeStartDate: '2026-09-01',
      activeEndDate: '2026-09-01',
    });
    assert.equal(params.get('state'), null);
    assert.equal(params.get('choice'), null);
    assert.equal(params.get('page'), null);
  });
  it('바뀐 조건은 URL에 남겨 왕복해도 같은 값이 나온다', () => {
    const params = serializeCountsFilters({
      state: 3,
      page: 2,
      startDate: '2026-01-01',
      endDate: '2026-09-01',
      dateChoice: 'weekly',
      activeStartDate: '2026-08-25',
      activeEndDate: '2026-09-01',
    });
    assert.deepEqual(parseCountsFilters(params), {
      state: 3,
      page: 2,
      startDate: '2026-01-01',
      endDate: '2026-09-01',
      dateChoice: 'weekly',
      activeStartDate: '2026-08-25',
      activeEndDate: '2026-09-01',
    });
  });
  it('마지막 쪽은 전체 개수로 계산한다', () => {
    assert.equal(countDailyPages(0), 1);
    assert.equal(countDailyPages(10), 1);
    assert.equal(countDailyPages(11), 2);
  });
});

describe('활성/비활성 라벨', () => {
  it('구간 선택에 따라 이름이 바뀌고 기간은 두 번째 라벨이 없다', () => {
    assert.deepEqual(getActiveLabels('daily'), {
      first: '오늘',
      second: '어제',
    });
    assert.deepEqual(getActiveLabels('weekly'), {
      first: '이번 주',
      second: '지난주',
    });
    assert.deepEqual(getActiveLabels('monthly'), {
      first: '이번 달',
      second: '저번달',
    });
    assert.deepEqual(getActiveLabels('custom'), {
      first: '선택한 기간 동안',
      second: '',
    });
  });
});

describe('플랫폼 별 누적 개수 정렬', () => {
  it('고정된 6개 순서로 정렬하고 빠진 플랫폼은 0으로 채운다', () => {
    const ordered = orderPlatformCounts([
      { platform: 'youtube', count: 5 },
      { platform: 'instagram', count: 10 },
    ]);
    assert.deepEqual(
      ordered.map((item) => item.platform),
      [
        'instagram',
        'youtube',
        'naver-blog',
        'google-news',
        'twitter',
        'naver-news',
      ],
    );
    assert.equal(ordered[0].count, 10);
    assert.equal(ordered[1].count, 5);
    assert.equal(ordered[2].count, 0);
  });
});

describe('일간 플랫폼 개수 변환', () => {
  it('필드명을 플랫폼 코드로 옮기고 합계를 계산한다', () => {
    const mapped = mapDailyPlatformCount({
      date: '2026-09-10',
      instagram: 3,
      youtube: 1,
      naverBlog: 2,
      twitter: 0,
      googleNews: 4,
      naverNews: 5,
    });
    assert.equal(mapped.counts['naver-blog'], 2);
    assert.equal(mapped.counts['google-news'], 4);
    assert.equal(mapped.total, 15);
  });
});

describe('콘텐츠 순위 조회 조건', () => {
  it('URL의 잘못된 값을 기본값으로 되돌린다', () => {
    const filters = parseContentRankFilters(
      new URLSearchParams('sort=oops&dateChoice=oops'),
    );
    assert.equal(filters.sort, 'uv');
    assert.equal(filters.dateChoice, 'daily');
  });
  it('구간 선택마다 기본 기간이 다르다', () => {
    assert.deepEqual(Object.keys(defaultRangeForRankChoice('daily')), [
      'startDate',
      'endDate',
    ]);
    const daily = defaultRangeForRankChoice('daily');
    const weekly = defaultRangeForRankChoice('weekly');
    const monthly = defaultRangeForRankChoice('monthly');
    assert.ok(daily.startDate > weekly.startDate);
    assert.ok(weekly.startDate > monthly.startDate);
  });
  it('기본 정렬(uv)·구간(daily)은 URL에 남기지 않는다', () => {
    const params = serializeContentRankFilters({
      sort: 'uv',
      dateChoice: 'daily',
      startDate: '2026-09-01',
      endDate: '2026-09-10',
    });
    assert.equal(params.get('sort'), null);
    assert.equal(params.get('dateChoice'), null);
  });
  it('바뀐 조건은 URL에 남겨 왕복해도 같은 값이 나온다', () => {
    const params = serializeContentRankFilters({
      sort: 'pv',
      dateChoice: 'weekly',
      startDate: '2026-06-01',
      endDate: '2026-09-01',
    });
    assert.deepEqual(parseContentRankFilters(params), {
      sort: 'pv',
      dateChoice: 'weekly',
      startDate: '2026-06-01',
      endDate: '2026-09-01',
    });
  });
});

describe('요일·구간 라벨', () => {
  it('요일을 한글로 돌려준다', () => {
    // 2026-09-13은 일요일이다.
    assert.equal(getWeekdayLabel('2026-09-13'), '일');
  });
  it('일간은 요일을, 월간은 접미사를 붙이고 주간은 그대로 둔다', () => {
    assert.equal(formatBucketLabel('2026-09-13', 'daily'), '2026-09-13(일)');
    assert.equal(formatBucketLabel('2026-09', 'monthly'), '2026-09 월');
    assert.equal(formatBucketLabel('2026-09-07', 'weekly'), '2026-09-07');
  });
});

describe('순위 자리 목록 정규화', () => {
  it('배열은 그대로 둔다', () => {
    assert.deepEqual(normalizeRankSlots([1, 2, 3]), [1, 2, 3]);
  });
  it('문자열 키 객체는 오름차순으로 배열로 바꾼다', () => {
    assert.deepEqual(
      normalizeRankSlots({ '20': 'd', '3': 'a', '6': 'b', '15': 'c' }),
      ['a', 'b', 'c', 'd'],
    );
  });
  it('없으면 빈 배열로 본다', () => {
    assert.deepEqual(normalizeRankSlots(null), []);
    assert.deepEqual(normalizeRankSlots(undefined), []);
  });
});

describe('콘텐츠 순위 자리 계산', () => {
  it('article·posted_article이 둘 다 없는 자리만 건너뛰고, article 없는 자리는 순번은 쓰되 목록엔 안 보인다', () => {
    const bucket = mapContentRankBucket(
      {
        dateType: '2026-09-10',
        slots: [
          {
            article: null,
            postedArticle: null,
            uvCount: 0,
            pvCount: 0,
          },
          {
            article: { id: 1, platform: 'youtube', title: 'A' },
            postedArticle: null,
            uvCount: 5,
            pvCount: 10,
          },
          {
            article: null,
            postedArticle: { id: 99 },
            uvCount: 0,
            pvCount: 0,
          },
          {
            article: { id: 2, platform: 'naver-blog', contents: '본문' },
            postedArticle: null,
            uvCount: 1,
            pvCount: 2,
          },
        ],
      },
      'daily',
    );
    assert.equal(bucket.hasData, true);
    assert.deepEqual(
      bucket.items.map((item) => item.rank),
      [1, 3],
    );
    assert.equal(bucket.items[1].title, '본문');
  });
  it('구간 자체에 자리가 하나도 없으면(응답에 articles가 없음) 데이터 없음으로 본다', () => {
    const bucket = mapContentRankBucket(
      { dateType: '2025-08', slots: [] },
      'monthly',
    );
    assert.equal(bucket.hasData, false);
    assert.deepEqual(bucket.items, []);
  });
  it('모든 자리가 비어 있으면 데이터 없음으로 본다', () => {
    const bucket = mapContentRankBucket(
      {
        dateType: '2026-09-10',
        slots: [{ article: null, postedArticle: null, uvCount: 0, pvCount: 0 }],
      },
      'daily',
    );
    assert.equal(bucket.hasData, false);
    assert.deepEqual(bucket.items, []);
  });
  it('100위까지만 보여준다', () => {
    const slots = Array.from({ length: 101 }, (_, i) => makeSlot(i));
    const bucket = mapContentRankBucket(
      { dateType: '2026-09-10', slots },
      'daily',
    );
    assert.equal(bucket.items.length, 100);
    assert.equal(bucket.items.at(-1)?.rank, 100);
  });
});

function makeSlot(index: number) {
  return {
    article: { id: index, platform: 'youtube', title: `제목${index}` },
    postedArticle: null,
    uvCount: 0,
    pvCount: 0,
  };
}
