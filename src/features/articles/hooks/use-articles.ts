import { useQuery } from '@tanstack/react-query';
import { getArticles } from '../api/articles';
import type { ArticleFilters } from '../model/filters';

export const articleKeys = {
  all: ['articles'] as const,
  lists: () => [...articleKeys.all, 'list'] as const,
  // 매체는 응답을 바꾸는 조건이므로 반드시 key에 포함한다.
  list: (mediaId: number, state: number, filters: ArticleFilters) =>
    [...articleKeys.lists(), mediaId, state, filters] as const,
};

export function useArticleList(
  mediaId: number | null,
  state: number,
  filters: ArticleFilters,
) {
  return useQuery({
    queryKey: articleKeys.list(mediaId ?? 0, state, filters),
    queryFn: ({ signal }) => getArticles(filters, mediaId!, state, signal),
    enabled: mediaId !== null,
  });
}
