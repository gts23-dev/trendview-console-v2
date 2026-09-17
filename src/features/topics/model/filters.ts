import { z } from 'zod';

/** 기존 콘솔과 같은 20개다. 한 화면에 들어오고 스크롤이 길지 않다. */
export const TOPIC_PAGE_SIZE = 20;

const filtersSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(100).catch(''),
});

export type TopicFilters = z.infer<typeof filtersSchema>;

/** URL은 사용자가 고칠 수 있는 외부 입력이다. 잘못된 값은 기본값으로 돌린다. */
export function parseTopicFilters(params: URLSearchParams): TopicFilters {
  return filtersSchema.parse({
    page: params.get('page') ?? 1,
    search: params.get('search') ?? '',
  });
}

/** 기본값은 URL에 남기지 않아 주소를 짧게 유지한다. */
export function serializeTopicFilters(
  filters: TopicFilters,
  base?: URLSearchParams,
) {
  const params = new URLSearchParams(base);
  const entries: [string, string][] = [
    ['page', filters.page > 1 ? String(filters.page) : ''],
    ['search', filters.search],
  ];
  for (const [key, value] of entries) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  return params;
}

export function countTopicPages(totalCount: number) {
  return Math.max(1, Math.ceil(totalCount / TOPIC_PAGE_SIZE));
}

/**
 * 목록의 NO.는 서버가 주지 않는다. 기존 콘솔처럼 전체 개수에서 거꾸로 센다.
 * 최근에 등록한 카테고리가 큰 번호를 갖는다.
 */
export function topicRowNumber(
  totalCount: number,
  page: number,
  index: number,
) {
  return totalCount - (page - 1) * TOPIC_PAGE_SIZE - index;
}
