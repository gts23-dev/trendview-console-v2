import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteBaseKeyword,
  getBaseKeywords,
  saveBaseKeyword,
  toggleBaseKeywordState,
} from '../api/base-keywords';
import type { BaseKeywordFilters } from '../model/filters';
import type { BaseKeywordListResult } from '../model/types';

export const baseKeywordKeys = {
  all: ['base-keywords'] as const,
  lists: () => [...baseKeywordKeys.all, 'list'] as const,
  // 매체는 응답을 바꾸는 조건이므로 반드시 key에 포함한다.
  list: (mediaId: number, filters: BaseKeywordFilters) =>
    [...baseKeywordKeys.lists(), mediaId, filters] as const,
};

export function useBaseKeywordList(
  mediaId: number | null,
  filters: BaseKeywordFilters,
) {
  return useQuery({
    queryKey: baseKeywordKeys.list(mediaId ?? 0, filters),
    queryFn: ({ signal }) => getBaseKeywords(filters, mediaId!, signal),
    enabled: mediaId !== null,
  });
}

export function useSaveBaseKeyword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveBaseKeyword,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: baseKeywordKeys.lists() }),
  });
}

export function useDeleteBaseKeyword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBaseKeyword,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: baseKeywordKeys.lists() }),
  });
}

export function useToggleBaseKeywordState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleBaseKeywordState,
    // 스위치만 바꾸고 목록은 다시 받지 않는다. 기존 콘솔과 같은 동작이다.
    onMutate: (id) =>
      queryClient.setQueriesData<BaseKeywordListResult>(
        { queryKey: baseKeywordKeys.lists() },
        (current) =>
          current && {
            ...current,
            items: current.items.map((item) =>
              item.id === id ? { ...item, active: !item.active } : item,
            ),
          },
      ),
    // 실패하면 서버 값으로 되돌린다.
    onError: () =>
      queryClient.invalidateQueries({ queryKey: baseKeywordKeys.lists() }),
  });
}
