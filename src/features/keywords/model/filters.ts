import { z } from 'zod';

/** 기존 콘솔과 같은 50개다. */
export const BASE_KEYWORD_PAGE_SIZE = 50;

const filtersSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(100).catch(''),
});

export type BaseKeywordFilters = z.infer<typeof filtersSchema>;

/** URL은 사용자가 고칠 수 있는 외부 입력이다. 잘못된 값은 기본값으로 돌린다. */
export function parseBaseKeywordFilters(
  params: URLSearchParams,
): BaseKeywordFilters {
  return filtersSchema.parse({
    page: params.get('page') ?? 1,
    search: params.get('search') ?? '',
  });
}

/** 기본값은 URL에 남기지 않아 주소를 짧게 유지한다. */
export function serializeBaseKeywordFilters(
  filters: BaseKeywordFilters,
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

export function baseKeywordRowNumber(
  totalCount: number,
  page: number,
  index: number,
) {
  return totalCount - (page - 1) * BASE_KEYWORD_PAGE_SIZE - index;
}

/** 등록은 쉼표로 여러 개를 한 번에 받는다. 빈 조각과 중복은 버린다. */
export function splitKeywords(value: string) {
  return [
    ...new Set(
      value
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    ),
  ];
}
