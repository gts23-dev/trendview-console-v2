import { useQuery } from '@tanstack/react-query';
import { getTagTotals } from '../api/tag-totals';
import type { TagTotalFilters } from '../model/filters';

export const tagTotalKeys = {
  all: ['tag-totals'] as const,
  lists: () => [...tagTotalKeys.all, 'list'] as const,
  // 매체는 응답을 바꾸는 조건이므로 반드시 key에 포함한다.
  list: (mediaId: number, filters: TagTotalFilters) =>
    [...tagTotalKeys.lists(), mediaId, filters] as const,
};

export function useTagTotalList(
  mediaId: number | null,
  filters: TagTotalFilters,
) {
  return useQuery({
    queryKey: tagTotalKeys.list(mediaId ?? 0, filters),
    queryFn: ({ signal }) => getTagTotals(filters, mediaId!, signal),
    enabled: mediaId !== null,
  });
}
