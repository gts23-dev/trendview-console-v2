import { useInfiniteQuery } from '@tanstack/react-query';
import { getUserLogs, type UserLogCursor } from '../api/logs';
import type { UserLogFilters } from '../model/filters';

export const userLogKeys = {
  all: ['user-logs'] as const,
  list: (mediaId: number, filters: UserLogFilters) =>
    [...userLogKeys.all, mediaId, filters] as const,
};

/**
 * 조건이 하나라도 바뀌면 query key가 달라져 커서가 자동으로 처음부터
 * 다시 시작한다 — 기존 콘솔이 필터를 바꿀 때마다 `this.items = []`와
 * `delete this.requestBody.search_after`를 10곳 가까이 반복하던 것과 같은
 * 효과를, 여기서는 캐시 키 하나로 해결한다.
 */
export function useUserLogs(mediaId: number | null, filters: UserLogFilters) {
  return useInfiniteQuery({
    queryKey: userLogKeys.list(mediaId ?? 0, filters),
    queryFn: ({ pageParam, signal }) =>
      getUserLogs(filters, mediaId!, pageParam, signal),
    initialPageParam: null as UserLogCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: mediaId !== null,
  });
}
