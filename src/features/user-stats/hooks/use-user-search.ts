import { useQuery } from '@tanstack/react-query';
import { getUserSearchDetail } from '../api/user-search';
import type { UserSearchFilters } from '../model/user-search';

export const userSearchKeys = {
  all: ['user-search'] as const,
  detail: (mediaId: number, filters: UserSearchFilters) =>
    [...userSearchKeys.all, mediaId, filters] as const,
};

/** 검색어가 비어 있으면(첫 진입) 요청하지 않는다 — 기존 콘솔과 동일. */
export function useUserSearchDetail(
  mediaId: number | null,
  filters: UserSearchFilters,
) {
  return useQuery({
    queryKey: userSearchKeys.detail(mediaId ?? 0, filters),
    queryFn: ({ signal }) => getUserSearchDetail(filters, mediaId!, signal),
    enabled: mediaId !== null && filters.search !== '',
  });
}
