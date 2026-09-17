import { z } from 'zod';

/** 기존 콘솔과 같은 16개다. */
export const TAG_IGNORE_PAGE_SIZE = 16;

/** 제외 적용 여부 필터. 빈 값이면 서버에 조건을 보내지 않는다. */
export const IGNORE_FILTERS = [
  { value: '', label: '전체' },
  { value: '1', label: '적용' },
  { value: '0', label: '적용 안함' },
] as const;

const filtersSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(100).catch(''),
  ignore: z.enum(['', '1', '0']).catch(''),
});

export type TagIgnoreFilters = z.infer<typeof filtersSchema>;

/** URL은 사용자가 고칠 수 있는 외부 입력이다. 잘못된 값은 기본값으로 돌린다. */
export function parseTagIgnoreFilters(
  params: URLSearchParams,
): TagIgnoreFilters {
  return filtersSchema.parse({
    page: params.get('page') ?? 1,
    search: params.get('search') ?? '',
    ignore: params.get('ignore') ?? '',
  });
}

/** 기본값은 URL에 남기지 않아 주소를 짧게 유지한다. */
export function serializeTagIgnoreFilters(
  filters: TagIgnoreFilters,
  base?: URLSearchParams,
) {
  const params = new URLSearchParams(base);
  const entries: [string, string][] = [
    ['page', filters.page > 1 ? String(filters.page) : ''],
    ['search', filters.search],
    ['ignore', filters.ignore],
  ];
  for (const [key, value] of entries) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  return params;
}

/**
 * 목록의 NO.는 서버가 주지 않는다. 기존 콘솔처럼 전체 개수에서 거꾸로 센다.
 */
export function tagIgnoreRowNumber(
  totalCount: number,
  page: number,
  index: number,
) {
  return totalCount - (page - 1) * TAG_IGNORE_PAGE_SIZE - index;
}
