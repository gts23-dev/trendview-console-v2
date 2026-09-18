import { z } from 'zod';
import { shiftDate, today } from '@/shared/utils/format';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const filtersSchema = z.object({
  search: z.string().trim().max(100).catch(''),
  startDate: z.string().regex(DATE).catch(''),
  endDate: z.string().regex(DATE).catch(''),
});

export type UserSearchFilters = z.infer<typeof filtersSchema>;

/** 기존 콘솔의 기본 구간(최근 30일)과 같다. */
export function defaultUserSearchRange() {
  return { startDate: shiftDate(30), endDate: today() };
}

export function parseUserSearchFilters(
  params: URLSearchParams,
): UserSearchFilters {
  const defaults = defaultUserSearchRange();
  return filtersSchema.parse({
    search: params.get('search') ?? '',
    startDate: params.get('start') ?? defaults.startDate,
    endDate: params.get('end') ?? defaults.endDate,
  });
}

export function serializeUserSearchFilters(
  filters: UserSearchFilters,
  base?: URLSearchParams,
) {
  const params = new URLSearchParams(base);
  const entries: [string, string][] = [
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
