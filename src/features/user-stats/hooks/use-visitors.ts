import { useQuery } from '@tanstack/react-query';
import { getVisitorRanks } from '../api/visitors';
import type { VisitorFilters } from '../model/visitors';

export const visitorKeys = {
  all: ['visitors'] as const,
  lists: () => [...visitorKeys.all, 'list'] as const,
  // 매체는 응답을 바꾸는 조건이므로 반드시 key에 포함한다.
  list: (mediaId: number, filters: VisitorFilters) =>
    [...visitorKeys.lists(), mediaId, filters] as const,
};

export function useVisitorRanks(
  mediaId: number | null,
  filters: VisitorFilters,
) {
  return useQuery({
    queryKey: visitorKeys.list(mediaId ?? 0, filters),
    queryFn: ({ signal }) => getVisitorRanks(filters, mediaId!, signal),
    enabled: mediaId !== null,
  });
}
