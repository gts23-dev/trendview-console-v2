import { z } from 'zod';

/**
 * 기존 콘솔은 쪽 없이 전부 보여 줬다. 서버가 쪽 없이 전체를 주므로 화면에서
 * 나눈다.
 */
export const USER_PAGE_SIZE = 20;

const filtersSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(100).catch(''),
});

export type UserFilters = z.infer<typeof filtersSchema>;

/** URL은 사용자가 고칠 수 있는 외부 입력이다. 잘못된 값은 기본값으로 돌린다. */
export function parseUserFilters(params: URLSearchParams): UserFilters {
  return filtersSchema.parse({
    page: params.get('page') ?? 1,
    search: params.get('search') ?? '',
  });
}

/** 기본값은 URL에 남기지 않아 주소를 짧게 유지한다. */
export function serializeUserFilters(
  filters: UserFilters,
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

export function pageUsers<T>(users: T[], page: number) {
  return users.slice((page - 1) * USER_PAGE_SIZE, page * USER_PAGE_SIZE);
}
