import { useQuery } from '@tanstack/react-query';
import { getContentRanks } from '../api/content-ranks';
import type { ContentRankFilters } from '../model/content-ranks';

export const contentRankKeys = {
  all: ['content-ranks'] as const,
  lists: () => [...contentRankKeys.all, 'list'] as const,
  list: (mediaId: number, filters: ContentRankFilters) =>
    [...contentRankKeys.lists(), mediaId, filters] as const,
};

export function useContentRanks(
  mediaId: number | null,
  filters: ContentRankFilters,
) {
  return useQuery({
    queryKey: contentRankKeys.list(mediaId ?? 0, filters),
    queryFn: ({ signal }) => getContentRanks(filters, mediaId!, signal),
    enabled: mediaId !== null,
  });
}
