import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  defaultUserLogRange,
  parseUserLogFilters,
  serializeUserLogFilters,
} from '../src/features/user-logs/model/filters.ts';
import {
  getEventColor,
  getEventLabel,
  mapUserLog,
} from '../src/features/user-logs/model/map-log.ts';

describe('사용자 접속 로그 조회 조건', () => {
  it('기본값은 빈 필터에 최근 28일 구간을 채운다', () => {
    const filters = parseUserLogFilters(new URLSearchParams());
    assert.equal(filters.platform, '');
    assert.equal(filters.event, '');
    assert.deepEqual(filters.tags, []);
    assert.equal(filters.without, false);
    assert.ok(filters.startDate < filters.endDate);
  });
  it('구간은 정확히 28일 전이다(기존 콘솔의 달마다 들쭉날쭉한 계산과 다름)', () => {
    const { startDate, endDate } = defaultUserLogRange();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.round((end.getTime() - start.getTime()) / 86400000);
    assert.equal(days, 28);
  });
  it('잘못된 event 값은 기본값(전체)으로 되돌린다', () => {
    const filters = parseUserLogFilters(new URLSearchParams('event=oops'));
    assert.equal(filters.event, '');
  });
  it('태그는 여러 개를 담고 URL 왕복해도 순서가 보존된다', () => {
    const params = serializeUserLogFilters({
      platform: 'youtube',
      event: 'click',
      articleId: '123',
      userId: 'user-1',
      tags: ['a', 'b'],
      without: true,
      startDate: '2026-01-01',
      endDate: '2026-09-01',
    });
    assert.deepEqual(parseUserLogFilters(params), {
      platform: 'youtube',
      event: 'click',
      articleId: '123',
      userId: 'user-1',
      tags: ['a', 'b'],
      without: true,
      startDate: '2026-01-01',
      endDate: '2026-09-01',
    });
  });
  it('빈 조건은 URL에 남기지 않는다', () => {
    const params = serializeUserLogFilters({
      platform: '',
      event: '',
      articleId: '',
      userId: '',
      tags: [],
      without: false,
      startDate: '2026-01-01',
      endDate: '2026-09-01',
    });
    assert.equal(params.get('platform'), null);
    assert.equal(params.get('without'), null);
    assert.equal(params.getAll('tag').length, 0);
  });
});

describe('사용자 접속 로그 행동 라벨', () => {
  it('visit·click·favorite는 정확히 매핑하고, 그 외는 좋아요로 본다', () => {
    assert.equal(getEventLabel('visit'), '방문');
    assert.equal(getEventLabel('click'), '클릭');
    assert.equal(getEventLabel('favorite'), '즐겨찾기');
    assert.equal(getEventLabel('like'), '좋아요');
    assert.equal(getEventLabel(''), '좋아요');
    assert.equal(getEventLabel('unknown'), '좋아요');
  });
  it('색상도 같은 규칙으로 매핑한다', () => {
    assert.equal(getEventColor('visit'), 'indigo');
    assert.equal(getEventColor('click'), 'info');
    assert.equal(getEventColor('favorite'), 'green');
    assert.equal(getEventColor('like'), 'pink');
    assert.equal(getEventColor('unknown'), 'pink');
  });
});

describe('사용자 접속 로그 변환', () => {
  it('글번호가 있으면 서버가 보낸 event를 그대로 쓴다', () => {
    const item = mapUserLog({
      platform: 'youtube',
      article_id: 42,
      event: 'like',
      tags: ['t1'],
      user_id: 'u1',
      created_at: '2026-09-10 12:34:56',
      device: { adid: 'device-1' },
    });
    assert.equal(item.event, 'like');
    assert.equal(item.articleId, 42);
    assert.equal(item.presentDate, '2026-09-10');
    assert.equal(item.presentTime, '12:34:56');
    assert.equal(item.adid, 'device-1');
  });
  it('글번호가 없으면 방문으로 본다', () => {
    const item = mapUserLog({
      platform: 'youtube',
      article_id: null,
      event: 'click',
      user_id: 'u1',
      created_at: '2026-09-10 00:00:00',
    });
    assert.equal(item.event, 'visit');
    assert.equal(item.articleId, null);
  });
  it('tags·device가 없으면 빈 배열·null로 본다', () => {
    const item = mapUserLog({
      platform: 'youtube',
      article_id: 1,
      event: 'visit',
      user_id: 'u1',
      created_at: '2026-09-10 00:00:00',
    });
    assert.deepEqual(item.tags, []);
    assert.equal(item.adid, null);
  });
});
