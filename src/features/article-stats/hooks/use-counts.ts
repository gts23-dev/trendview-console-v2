import { useQuery } from '@tanstack/react-query';
import {
  getArticleCounts,
  getDailyPlatformCounts,
  getPlatformCounts,
} from '../api/counts';
import type { ContentState, CountsFilters } from '../model/counts';

export const articleStatsKeys = {
  all: ['article-stats'] as const,
  counts: (
    mediaId: number,
    filters: Pick<
      CountsFilters,
      'dateChoice' | 'activeStartDate' | 'activeEndDate'
    >,
  ) => [...articleStatsKeys.all, 'counts', mediaId, filters] as const,
  platform: (mediaId: number, state: ContentState) =>
    [...articleStatsKeys.all, 'platform', mediaId, state] as const,
  daily: (
    mediaId: number,
    state: ContentState,
    filters: Pick<CountsFilters, 'startDate' | 'endDate'>,
  ) => [...articleStatsKeys.all, 'daily', mediaId, state, filters] as const,
};

/** 활성/비활성 카드는 매체·구간선택·활성구간에만 반응한다. state(카드 선택)나
 * 일간표 기간이 바뀌어도 다시 부를 필요가 없다. */
export function useArticleCounts(
  mediaId: number | null,
  filters: CountsFilters,
) {
  return useQuery({
    queryKey: articleStatsKeys.counts(mediaId ?? 0, {
      dateChoice: filters.dateChoice,
      activeStartDate: filters.activeStartDate,
      activeEndDate: filters.activeEndDate,
    }),
    queryFn: ({ signal }) => getArticleCounts(filters, mediaId!, signal),
    enabled: mediaId !== null,
  });
}

export function usePlatformCounts(mediaId: number | null, state: ContentState) {
  return useQuery({
    queryKey: articleStatsKeys.platform(mediaId ?? 0, state),
    queryFn: ({ signal }) => getPlatformCounts(state, mediaId!, signal),
    enabled: mediaId !== null,
  });
}

export function useDailyPlatformCounts(
  mediaId: number | null,
  state: ContentState,
  filters: CountsFilters,
) {
  return useQuery({
    queryKey: articleStatsKeys.daily(mediaId ?? 0, state, {
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
    queryFn: ({ signal }) =>
      getDailyPlatformCounts(filters, state, mediaId!, signal),
    enabled: mediaId !== null,
  });
}
