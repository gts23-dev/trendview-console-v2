import { useQuery } from '@tanstack/react-query';
import { getTagBusinessStats } from '../api/tag-business-stats';
import { getTagDailyStats } from '../api/tag-ranks';
import type { TagRankFilters } from '../model/tag-ranks';

export const tagRankKeys = {
  all: ['tag-ranks'] as const,
  list: (mediaId: number, filters: TagRankFilters) =>
    [...tagRankKeys.all, mediaId, filters] as const,
};

export function useTagDailyStats(
  mediaId: number | null,
  filters: TagRankFilters,
) {
  return useQuery({
    queryKey: tagRankKeys.list(mediaId ?? 0, filters),
    queryFn: ({ signal }) => getTagDailyStats(filters, mediaId!, signal),
    enabled: mediaId !== null,
  });
}

export const tagBusinessStatsKeys = {
  all: ['tag-business-stats'] as const,
  detail: (mediaId: number) => [...tagBusinessStatsKeys.all, mediaId] as const,
};

export function useTagBusinessStats(mediaId: number | null) {
  return useQuery({
    queryKey: tagBusinessStatsKeys.detail(mediaId ?? 0),
    queryFn: ({ signal }) => getTagBusinessStats(mediaId!, signal),
    enabled: mediaId !== null,
  });
}
