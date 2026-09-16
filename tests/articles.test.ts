import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  countArticlePages,
  parseArticleFilters,
  serializeArticleFilters,
  toArticleQuery,
} from '../src/features/articles/model/filters.ts';
import {
  mapArticle,
  type ArticleData,
} from '../src/features/articles/model/map-article.ts';
import { mapArticleReport } from '../src/features/articles/model/map-report.ts';
import {
  getPlatformBadge,
  getPlatformLabel,
  PLATFORM_FILTERS,
} from '../src/features/articles/model/platforms.ts';
import {
  getYoutubeId,
  isYoutubeShorts,
} from '../src/features/articles/model/video.ts';

const BASE = 'https://cdn.test/main/';

// 실제 응답에서 화면이 쓰는 필드만 옮긴 값이다.
const YOUTUBE: ArticleData = {
  id: -17889085102101,
  platform: 'youtube',
  type: 'channel',
  keyword: null,
  channel: 'UCDqaUIUSJP5EVMEI178Zfag',
  topic: '음악',
  title: 'bgf - 죠지',
  contents: '곡 정보',
  url: 'https://www.youtube.com/watch?v=S2jQInIA0KQ',
  storage_thumbnail_url: 'thumbnails/2026/1788979881_x_mqdefault.jpg_w720',
  thumbnail_url: 'https://i.ytimg.com/vi/S2jQInIA0KQ/mqdefault.jpg',
  thumbnail_width: 320,
  thumbnail_height: 180,
  business_tag: null,
  state: 0,
  view_count: 0,
  date: '2026-09-09 08:00:22',
  created_at: '2026-09-10 03:51:22',
  article_owner: { name: '금영 노래방 공식 유튜브 채널' },
};

describe('목록 조회 조건', () => {
  it('URL의 잘못된 값을 기본값으로 되돌린다', () => {
    const filters = parseArticleFilters(
      new URLSearchParams('page=-3&sort=oops&start=2026-13&platform=fake'),
    );
    assert.equal(filters.page, 1);
    assert.equal(filters.sort, 'sort_id');
    assert.equal(filters.startDate, '');
    assert.deepEqual(filters.platforms, []);
  });
  it('시작일이 종료일보다 늦으면 뒤집는다', () => {
    const filters = parseArticleFilters(
      new URLSearchParams('start=2026-09-10&end=2026-09-01'),
    );
    assert.equal(filters.startDate, '2026-09-01');
    assert.equal(filters.endDate, '2026-09-10');
  });
  it('아는 플랫폼과 페이지, 검색어는 보존한다', () => {
    const filters = parseArticleFilters(
      new URLSearchParams('page=3&sort=id&search= 아이유 &platform=youtube'),
    );
    assert.equal(filters.page, 3);
    assert.equal(filters.sort, 'id');
    assert.equal(filters.search, '아이유');
    assert.deepEqual(filters.platforms, ['youtube']);
  });
  it('기본값은 URL에 남기지 않고 전역 매체는 건드리지 않는다', () => {
    const params = serializeArticleFilters(
      {
        page: 1,
        sort: 'sort_id',
        search: '',
        startDate: '',
        endDate: '',
        platforms: [],
      },
      new URLSearchParams('media=5&page=4&sort=id&search=x&platform=youtube'),
    );
    assert.equal(params.get('media'), '5');
    assert.equal(params.get('page'), null);
    assert.equal(params.get('sort'), null);
    assert.equal(params.get('search'), null);
    assert.deepEqual(params.getAll('platform'), []);
  });
  it('서버 요청은 기존 콘솔의 형태를 유지한다', () => {
    const query = toArticleQuery(
      {
        page: 2,
        sort: 'id',
        search: '아이유',
        startDate: '2026-09-01',
        endDate: '2026-09-10',
        platforms: ['youtube', 'naver-news'],
      },
      5,
      0,
    );
    assert.equal(query.get('platform'), '#youtube#naver-news');
    assert.equal(query.get('search'), '#아이유');
    assert.equal(query.get('type'), '#keyword#channel');
    assert.equal(query.get('per_page'), '24');
    assert.equal(query.get('media_id'), '5');
    assert.equal(query.get('state'), '0');
  });
  it('플랫폼을 고르지 않으면 전체를 명시해 보낸다', () => {
    const query = toArticleQuery(
      {
        page: 1,
        sort: 'sort_id',
        search: '',
        startDate: '',
        endDate: '',
        platforms: [],
      },
      1,
      1,
    );
    assert.equal(
      query.get('platform'),
      '#youtube#naver-blog#google-news#naver-news',
    );
    assert.equal(query.get('search'), '');
  });
  it('조건이 있으면 URL에 남겨 링크로 공유할 수 있다', () => {
    const params = serializeArticleFilters({
      page: 3,
      sort: 'id',
      search: '아이유',
      startDate: '2026-09-01',
      endDate: '2026-09-10',
      platforms: ['youtube', 'naver-news'],
    });
    assert.equal(params.get('page'), '3');
    assert.equal(params.get('sort'), 'id');
    assert.equal(params.get('search'), '아이유');
    assert.equal(params.get('start'), '2026-09-01');
    assert.equal(params.get('end'), '2026-09-10');
    assert.deepEqual(params.getAll('platform'), ['youtube', 'naver-news']);
    // 왕복해도 같은 조건이 나온다.
    assert.deepEqual(parseArticleFilters(params), {
      page: 3,
      sort: 'id',
      search: '아이유',
      startDate: '2026-09-01',
      endDate: '2026-09-10',
      platforms: ['youtube', 'naver-news'],
    });
  });
  it('마지막 페이지는 검색 결과 수로 계산한다', () => {
    assert.equal(countArticlePages(0), 1);
    assert.equal(countArticlePages(24), 1);
    assert.equal(countArticlePages(25), 2);
    assert.equal(countArticlePages(355), 15);
  });
});

describe('플랫폼 표기', () => {
  it('아는 플랫폼은 한글 라벨을 주고 모르는 값은 그대로 보여준다', () => {
    assert.equal(getPlatformLabel('naver-blog'), '네이버블로그');
    assert.equal(getPlatformLabel('threads'), 'threads');
  });
  it('심볼이 같은 네이버 계열은 종류 글자로 구분한다', () => {
    const blog = getPlatformBadge('naver-blog');
    const news = getPlatformBadge('naver-news');
    assert.equal(blog.mark, news.mark);
    assert.notEqual(blog.text, news.text);
  });
  it('배지는 예외 없이 로고와 종류 글자를 함께 가진다', () => {
    for (const platform of PLATFORM_FILTERS) {
      const badge = getPlatformBadge(platform);
      assert.notEqual(badge.mark, '');
      assert.notEqual(badge.text, '');
    }
  });
  it('모르는 플랫폼은 이름을 그대로 배지에 담는다', () => {
    assert.deepEqual(getPlatformBadge('threads').text, 'threads');
    assert.equal(getPlatformBadge('threads').mark, '');
  });
});

describe('목록 응답 변환', () => {
  it('정렬 기준에 따라 앞세우는 날짜와 라벨이 바뀐다', () => {
    const collected = mapArticle(YOUTUBE, BASE, 'sort_id');
    assert.equal(collected.primaryDateLabel, '수집일');
    assert.equal(collected.primaryDate, '2026-09-10');
    assert.equal(collected.secondaryDateLabel, '작성일');
    assert.equal(collected.secondaryDate, '2026-09-09');

    const written = mapArticle(YOUTUBE, BASE, 'id');
    assert.equal(written.primaryDateLabel, '작성일');
    assert.equal(written.primaryDate, '2026-09-09');
  });
  it('스토리지 이미지를 먼저 쓰고 없으면 플랫폼 원본을 쓴다', () => {
    assert.equal(
      mapArticle(YOUTUBE, BASE, 'sort_id').imageUrl,
      'https://cdn.test/main/thumbnails/2026/1788979881_x_mqdefault.jpg_w720',
    );
    assert.equal(
      mapArticle({ ...YOUTUBE, storage_thumbnail_url: '' }, BASE, 'sort_id')
        .imageUrl,
      YOUTUBE.thumbnail_url,
    );
    // 스토리지 URL 설정이 없어도 원본으로 화면이 채워진다.
    assert.equal(
      mapArticle(YOUTUBE, '', 'sort_id').imageUrl,
      YOUTUBE.thumbnail_url,
    );
  });
  it('대표 썸네일이 없으면 첨부 이미지를 쓰고 그다음이 플랫폼 원본이다', () => {
    const attached = {
      ...YOUTUBE,
      storage_thumbnail_url: '',
      article_medias: [{ storage_url: 'medias/2026/1.jpg' }],
    };
    assert.equal(
      mapArticle(attached, BASE, 'sort_id').imageUrl,
      'https://cdn.test/main/medias/2026/1.jpg',
    );
    assert.equal(
      mapArticle({ ...attached, article_medias: [] }, BASE, 'sort_id').imageUrl,
      YOUTUBE.thumbnail_url,
    );
  });
  it('채널 수집은 채널 id 대신 채널명을 보여준다', () => {
    assert.equal(
      mapArticle(YOUTUBE, BASE, 'sort_id').source,
      '금영 노래방 공식 유튜브 채널',
    );
    // 채널명이 없으면 기존 콘솔처럼 채널 id로 되돌린다.
    assert.equal(
      mapArticle({ ...YOUTUBE, article_owner: null }, BASE, 'sort_id').source,
      'UCDqaUIUSJP5EVMEI178Zfag',
    );
    // 키워드 수집은 키워드를 우선한다.
    assert.equal(
      mapArticle(
        { ...YOUTUBE, type: 'keyword', keyword: '아이유' },
        BASE,
        'sort_id',
      ).source,
      '아이유',
    );
  });
  it('없는 값은 빈 문자열과 0으로 채워 화면이 깨지지 않게 한다', () => {
    const empty = mapArticle(
      { id: 1, platform: 'naver-news' },
      BASE,
      'sort_id',
    );
    assert.equal(empty.title, '');
    assert.equal(empty.imageUrl, '');
    assert.equal(empty.primaryDate, '');
    assert.equal(empty.businessTag, '');
    assert.equal(empty.viewCount, 0);
  });
  it('비즈니스 태그에는 해시를 붙인다', () => {
    assert.equal(
      mapArticle({ ...YOUTUBE, business_tag: '아이유' }, BASE, 'sort_id')
        .businessTag,
      '#아이유',
    );
  });
});

describe('상세 시트가 쓰는 목록 필드', () => {
  it('첨부 이미지에 스토리지 URL을 붙이고 해시태그를 쪼갠다', () => {
    const item = mapArticle(
      {
        ...YOUTUBE,
        hashtag: '#여행  #카페 ',
        article_medias: [
          { type: 'image', storage_url: 'medias/1.jpg', width: 1080 },
          { type: 'image', storage_url: '' },
        ],
      },
      BASE,
      'sort_id',
    );
    assert.deepEqual(item.hashtags, ['#여행', '#카페']);
    assert.equal(item.medias[0].imageUrl, 'https://cdn.test/main/medias/1.jpg');
    assert.equal(item.medias[0].height, 0);
    // 스토리지에 아직 없는 첨부는 빈 문자열로 남겨 화면에서 거른다.
    assert.equal(item.medias[1].imageUrl, '');
  });
  it('정렬과 무관하게 작성일과 수집일을 모두 담는다', () => {
    for (const sort of ['sort_id', 'id'] as const) {
      const item = mapArticle(YOUTUBE, BASE, sort);
      assert.equal(item.writtenDate, '2026-09-09');
      assert.equal(item.collectedDate, '2026-09-10');
    }
  });
});

describe('신고 내역 변환', () => {
  it('신고자 아이디가 숫자로 와도 문자열로 다룬다', () => {
    const report = mapArticleReport(
      { user_id: 42, user_name: '홍길동', created_at: '2026-09-10 03:51:22' },
      0,
    );
    assert.equal(report.userId, '42');
    assert.equal(report.date, '2026-09-10');
    assert.equal(report.description, '');
  });
});

describe('상세를 연 URL', () => {
  it('조건이 바뀌면 열려 있던 상세를 닫는다', () => {
    const params = serializeArticleFilters(
      {
        page: 2,
        sort: 'sort_id',
        search: '',
        startDate: '',
        endDate: '',
        platforms: [],
      },
      new URLSearchParams('media=5&article=123'),
    );
    assert.equal(params.get('article'), null);
    assert.equal(params.get('media'), '5');
  });
});

describe('기간 조건', () => {
  it('한쪽만 채워진 기간은 서버에 보내지 않는다', () => {
    const query = toArticleQuery(
      {
        page: 1,
        sort: 'sort_id',
        search: '',
        startDate: '2026-09-01',
        endDate: '',
        platforms: [],
      },
      1,
      0,
    );
    // 화면에서 종료일을 채워 주지만, URL을 직접 고친 경우가 남는다.
    assert.equal(query.get('start_date'), '2026-09-01');
    assert.equal(query.get('end_date'), '');
  });
});

describe('유튜브 주소', () => {
  it('일반 영상·단축 주소·쇼츠에서 id를 뽑는다', () => {
    assert.equal(
      getYoutubeId('https://www.youtube.com/watch?v=S2jQInIA0KQ'),
      'S2jQInIA0KQ',
    );
    assert.equal(getYoutubeId('https://youtu.be/S2jQInIA0KQ'), 'S2jQInIA0KQ');
    assert.equal(
      getYoutubeId('https://www.youtube.com/shorts/S2jQInIA0KQ'),
      'S2jQInIA0KQ',
    );
  });
  it('유튜브가 아니거나 형식이 다르면 빈 문자열이다', () => {
    assert.equal(getYoutubeId('https://blog.naver.com/abc'), '');
    assert.equal(getYoutubeId('https://www.youtube.com/watch?v=짧음'), '');
    assert.equal(getYoutubeId('not a url'), '');
    assert.equal(getYoutubeId(''), '');
    // 도메인 끝이 일치해야 한다. youtube.com.evil.test는 통과하면 안 된다.
    assert.equal(
      getYoutubeId('https://youtube.com.evil.test/watch?v=S2jQInIA0KQ'),
      '',
    );
  });
});

describe('쇼츠 판별', () => {
  it('주소에 shorts가 있거나 썸네일이 세로면 쇼츠로 본다', () => {
    assert.equal(isYoutubeShorts('https://www.youtube.com/shorts/abc'), true);
    // 수집 과정에서 일반 영상 주소로 바뀐 경우를 썸네일 비율로 잡는다.
    assert.equal(
      isYoutubeShorts('https://www.youtube.com/watch?v=abc', 268, 480),
      true,
    );
    assert.equal(
      isYoutubeShorts('https://www.youtube.com/watch?v=abc', 320, 180),
      false,
    );
    // 크기를 모르면 쇼츠로 단정하지 않는다.
    assert.equal(isYoutubeShorts('https://www.youtube.com/watch?v=abc'), false);
  });
});
