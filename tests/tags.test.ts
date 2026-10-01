import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  countTagTotalPages,
  parseTagTotalFilters,
  serializeTagTotalFilters,
  tagTotalRowNumber,
} from '../src/features/tags/model/filters.ts';
import { mapTagRankBucket } from '../src/features/tags/model/map-tag-rank.ts';
import { mapTagArticle } from '../src/features/tags/model/tag-articles.ts';
import {
  defaultRangeForTagRankChoice,
  formatTagRankDateLabel,
  parseTagRankFilters,
  serializeTagRankFilters,
} from '../src/features/tags/model/tag-ranks.ts';

describe('키워드(PK) 집계 조회 조건', () => {
  it('URL의 잘못된 값을 기본값으로 되돌린다', () => {
    const filters = parseTagTotalFilters(
      new URLSearchParams('page=-3&tagOrder=oops&sumOrder=oops'),
    );
    assert.equal(filters.page, 1);
    assert.equal(filters.tagOrder, 'asc');
    assert.equal(filters.sumOrder, 'desc');
  });
  it('구간을 지정하지 않으면 최근 1년을 기본값으로 채운다', () => {
    const filters = parseTagTotalFilters(new URLSearchParams());
    assert.notEqual(filters.startDate, '');
    assert.notEqual(filters.endDate, '');
    assert.ok(filters.startDate < filters.endDate);
  });
  it('집계순 정렬을 끄면 빈 문자열로 보존한다', () => {
    const filters = parseTagTotalFilters(new URLSearchParams('sumOrder='));
    assert.equal(filters.sumOrder, '');
  });
  it('기본 정렬은 URL에 남기지 않고 바꾼 정렬만 남긴다', () => {
    const params = serializeTagTotalFilters({
      page: 1,
      search: '',
      startDate: '2026-01-01',
      endDate: '2026-09-01',
      tagOrder: 'asc',
      sumOrder: 'desc',
    });
    assert.equal(params.get('tagOrder'), null);
    assert.equal(params.get('sumOrder'), null);
    assert.equal(params.get('start'), '2026-01-01');
    assert.equal(params.get('end'), '2026-09-01');
  });
  it('조건이 있으면 URL에 남겨 왕복해도 같은 값이 나온다', () => {
    const params = serializeTagTotalFilters({
      page: 2,
      search: '아이유',
      startDate: '2026-01-01',
      endDate: '2026-09-01',
      tagOrder: 'desc',
      sumOrder: '',
    });
    assert.deepEqual(parseTagTotalFilters(params), {
      page: 2,
      search: '아이유',
      startDate: '2026-01-01',
      endDate: '2026-09-01',
      tagOrder: 'desc',
      sumOrder: '',
    });
  });
  it('마지막 쪽은 전체 개수로 계산한다', () => {
    assert.equal(countTagTotalPages(0), 1);
    assert.equal(countTagTotalPages(30), 1);
    assert.equal(countTagTotalPages(31), 2);
  });
  it('번호는 전체 개수에서 거꾸로 센다', () => {
    assert.equal(tagTotalRowNumber(100, 1, 0), 100);
    assert.equal(tagTotalRowNumber(100, 2, 0), 70);
  });
});

describe('키워드(PK) 순위 조회 조건', () => {
  it('URL의 잘못된 값을 기본값으로 되돌린다', () => {
    const filters = parseTagRankFilters(
      new URLSearchParams('sort=oops&dateChoice=oops'),
    );
    assert.equal(filters.sort, 'uv');
    assert.equal(filters.dateChoice, 'daily');
  });
  it('구간 선택마다 기본 기간이 다르다', () => {
    const daily = defaultRangeForTagRankChoice('daily');
    const weekly = defaultRangeForTagRankChoice('weekly');
    const monthly = defaultRangeForTagRankChoice('monthly');
    assert.ok(daily.startDate > weekly.startDate);
    assert.ok(weekly.startDate > monthly.startDate);
  });
  it('기본 정렬(uv)·구간(daily)은 URL에 남기지 않는다', () => {
    const params = serializeTagRankFilters({
      sort: 'uv',
      dateChoice: 'daily',
      startDate: '2026-09-01',
      endDate: '2026-09-10',
    });
    assert.equal(params.get('sort'), null);
    assert.equal(params.get('dateChoice'), null);
  });
  it('바뀐 조건은 URL에 남겨 왕복해도 같은 값이 나온다', () => {
    const params = serializeTagRankFilters({
      sort: 'pv',
      dateChoice: 'monthly',
      startDate: '2026-06-01',
      endDate: '2026-09-01',
    });
    assert.deepEqual(parseTagRankFilters(params), {
      sort: 'pv',
      dateChoice: 'monthly',
      startDate: '2026-06-01',
      endDate: '2026-09-01',
    });
  });
});

describe('키워드(PK) 순위 구간 라벨', () => {
  it('일간은 요일을, 월간은 접미사를 붙이고 주간은 그대로 둔다', () => {
    // 2026-09-13은 일요일이다.
    assert.equal(
      formatTagRankDateLabel('2026-09-13', 'daily'),
      '2026-09-13(일)',
    );
    assert.equal(formatTagRankDateLabel('2026-09', 'monthly'), '2026-09 월');
    assert.equal(formatTagRankDateLabel('2026-09-07', 'weekly'), '2026-09-07');
  });
});

describe('키워드(PK) 순위 자리 계산', () => {
  it('빈 자리 개념 없이 배열 순서 그대로 순번을 매긴다', () => {
    const bucket = mapTagRankBucket(
      {
        dateType: '2026-09-10',
        slots: [
          { tag: 'a', uvCount: 5, pvCount: 10 },
          { tag: 'b', uvCount: 3, pvCount: 4 },
        ],
      },
      'daily',
    );
    assert.equal(bucket.hasData, true);
    assert.deepEqual(
      bucket.items.map((item) => item.rank),
      [1, 2],
    );
    assert.equal(bucket.dateType, '2026-09-10');
  });
  it('자리가 하나도 없으면 데이터 없음으로 본다', () => {
    const bucket = mapTagRankBucket(
      { dateType: '2026-09-10', slots: [] },
      'daily',
    );
    assert.equal(bucket.hasData, false);
    assert.deepEqual(bucket.items, []);
  });
  it('100위까지만 보여준다', () => {
    const slots = Array.from({ length: 120 }, (_, i) => ({
      tag: `tag${i}`,
      uvCount: 0,
      pvCount: 0,
    }));
    const bucket = mapTagRankBucket({ dateType: '2026-09-10', slots }, 'daily');
    assert.equal(bucket.items.length, 100);
    assert.equal(bucket.items.at(-1)?.rank, 100);
  });
});

describe('태그 게시정보 변환', () => {
  it('대표 썸네일이 있으면 그것을 쓴다', () => {
    const item = mapTagArticle(
      {
        id: 1,
        platform: 'naver-blog',
        title: '제목',
        contents: '본문',
        business_tag: '태그',
        storage_thumbnail_url: '/thumb.jpg',
        article_medias: [{ storage_url: '/media.jpg' }],
      },
      'https://storage.example.com',
    );
    assert.equal(item.imageUrl, 'https://storage.example.com/thumb.jpg');
    assert.equal(item.businessTag, '#태그');
  });
  it('대표 썸네일이 없으면 첨부 이미지를 쓴다', () => {
    const item = mapTagArticle(
      {
        id: 2,
        platform: 'instagram',
        article_medias: [{ storage_url: '/media.jpg' }],
      },
      'https://storage.example.com',
    );
    assert.equal(item.imageUrl, 'https://storage.example.com/media.jpg');
  });
  it('썸네일도 첨부도 없으면 원본 이미지로, 그것도 없으면 빈 문자열로 본다', () => {
    const withOrigin = mapTagArticle(
      {
        id: 3,
        platform: 'youtube',
        thumbnail_url: 'https://ext.example/x.jpg',
      },
      'https://storage.example.com',
    );
    assert.equal(withOrigin.imageUrl, 'https://ext.example/x.jpg');

    const withNone = mapTagArticle({ id: 4, platform: 'youtube' }, '');
    assert.equal(withNone.imageUrl, '');
    assert.equal(withNone.contents, '내용 없음');
    assert.equal(withNone.businessTag, '#태그없음');
  });
});
