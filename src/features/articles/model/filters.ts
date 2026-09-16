import { z } from 'zod';
import { PLATFORM_FILTERS } from './platforms';

/**
 * 한 페이지에 담는 개수. 기존 콘솔은 32였는데 어느 열 수로도 마지막 줄이
 * 어중간하게 남는다. 24는 화면에서 쓰는 2·3·4·6열 모두로 나누어떨어진다.
 * 열 수를 바꾸면 이 값도 함께 봐야 한다.
 */
export const ARTICLE_PAGE_SIZE = 24;

/** 정렬 기준. 서버 파라미터 값이 그대로 들어간다. */
export const ARTICLE_SORTS = [
  { value: 'sort_id', label: '수집일' },
  { value: 'id', label: '작성일' },
] as const;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const filtersSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  sort: z.enum(['sort_id', 'id']).catch('sort_id'),
  search: z.string().trim().max(100).catch(''),
  startDate: z.string().regex(DATE).catch(''),
  endDate: z.string().regex(DATE).catch(''),
  platforms: z.array(z.string()).catch([]),
});

export type ArticleFilters = z.infer<typeof filtersSchema>;

/**
 * URL은 사용자가 직접 고칠 수 있는 외부 입력이다. 잘못된 값은 기본값으로
 * 되돌리고 화면이 깨지지 않게 한다. 매체는 여기 두지 않는다. 전역 조회
 * 범위이므로 `useMediaScope()`에서 받는다.
 */
export function parseArticleFilters(params: URLSearchParams): ArticleFilters {
  const platforms = params
    .getAll('platform')
    .filter((value) => PLATFORM_FILTERS.includes(value as never));
  const parsed = filtersSchema.parse({
    page: params.get('page') ?? 1,
    sort: params.get('sort') ?? 'sort_id',
    search: params.get('search') ?? '',
    startDate: params.get('start') ?? '',
    endDate: params.get('end') ?? '',
    platforms,
  });
  // 시작일만 있으면 종료일을 비워 둔 채 보내지 않는다. 기존 콘솔은 이 경우
  // 종료일을 오늘로 채웠는데, 조건이 조용히 바뀌는 것보다 화면에서 안내한다.
  if (parsed.startDate && parsed.endDate && parsed.startDate > parsed.endDate)
    return { ...parsed, startDate: parsed.endDate, endDate: parsed.startDate };
  return parsed;
}

/** 기본값은 URL에 남기지 않아 주소를 짧게 유지한다. */
export function serializeArticleFilters(
  filters: ArticleFilters,
  base?: URLSearchParams,
) {
  const params = new URLSearchParams(base);
  params.delete('platform');
  // 조건이 바뀌면 열려 있던 상세는 목록에 없을 수 있으므로 함께 닫는다.
  params.delete('article');
  for (const platform of filters.platforms) params.append('platform', platform);
  const entries: [string, string][] = [
    ['page', filters.page > 1 ? String(filters.page) : ''],
    ['sort', filters.sort === 'sort_id' ? '' : filters.sort],
    ['search', filters.search],
    ['start', filters.startDate],
    ['end', filters.endDate],
  ];
  for (const [key, value] of entries) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  return params;
}

/**
 * 서버 요청 파라미터로 바꾼다. 기존 콘솔의 요청 형태를 그대로 유지한다.
 * 플랫폼과 유형은 `#`을 앞에 붙여 이어 붙이고, 검색어에도 `#`을 붙인다.
 */
export function toArticleQuery(
  filters: ArticleFilters,
  mediaId: number,
  state: number,
) {
  const platforms =
    filters.platforms.length > 0 ? filters.platforms : PLATFORM_FILTERS;
  return new URLSearchParams({
    page: String(filters.page),
    per_page: String(ARTICLE_PAGE_SIZE),
    sort: filters.sort,
    media_id: String(mediaId),
    state: String(state),
    // 기존 콘솔은 유형 버튼을 숨긴 뒤에도 두 값을 항상 함께 보냈다.
    type: '#keyword#channel',
    platform: platforms.map((platform) => `#${platform}`).join(''),
    search: filters.search ? `#${filters.search}` : '',
    start_date: filters.startDate,
    end_date: filters.endDate,
  });
}

export function countArticlePages(searchCount: number) {
  return Math.max(1, Math.ceil(searchCount / ARTICLE_PAGE_SIZE));
}
