import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteTagIgnore,
  getTagIgnores,
  toggleTagIgnore,
} from '../api/tag-ignores';
import type { TagIgnoreFilters } from '../model/filters';
import type { TagIgnoreListResult } from '../model/types';

export const tagIgnoreKeys = {
  all: ['tag-ignores'] as const,
  lists: () => [...tagIgnoreKeys.all, 'list'] as const,
  // 매체는 응답을 바꾸는 조건이므로 반드시 key에 포함한다.
  list: (mediaId: number, filters: TagIgnoreFilters) =>
    [...tagIgnoreKeys.lists(), mediaId, filters] as const,
};

export function useTagIgnoreList(
  mediaId: number | null,
  filters: TagIgnoreFilters,
) {
  return useQuery({
    queryKey: tagIgnoreKeys.list(mediaId ?? 0, filters),
    queryFn: ({ signal }) => getTagIgnores(filters, mediaId!, signal),
    enabled: mediaId !== null,
  });
}

export function useToggleTagIgnore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleTagIgnore,
    // 스위치만 바꾸고 목록은 다시 받지 않는다. 기존 콘솔과 같은 동작이다.
    // 재조회하면 제외여부로 걸러 보는 중일 때 방금 켠 행이 눈앞에서 사라진다.
    onMutate: (id) =>
      queryClient.setQueriesData<TagIgnoreListResult>(
        { queryKey: tagIgnoreKeys.lists() },
        (current) =>
          current && {
            ...current,
            items: current.items.map((item) =>
              item.id === id ? { ...item, ignore: !item.ignore } : item,
            ),
          },
      ),
    // 실패하면 서버 값으로 되돌린다.
    onError: () =>
      queryClient.invalidateQueries({ queryKey: tagIgnoreKeys.lists() }),
  });
}

export function useDeleteTagIgnore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTagIgnore,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: tagIgnoreKeys.lists() }),
  });
}
