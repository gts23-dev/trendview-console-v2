import { useQuery } from '@tanstack/react-query';
import { getArticlesByTag, type TagArticlesQuery } from '../api/tag-articles';

export const tagArticleKeys = {
  all: ['tag-articles'] as const,
  list: (query: TagArticlesQuery) => [...tagArticleKeys.all, query] as const,
};

/** `query`가 null이면(대화상자가 닫혀 있으면) 요청하지 않는다. */
export function useTagArticles(query: TagArticlesQuery | null) {
  return useQuery({
    queryKey: tagArticleKeys.list(
      query ?? {
        tag: '',
        mediaId: 0,
        dateChoice: 'daily',
        searchDate: '',
        page: 1,
      },
    ),
    queryFn: ({ signal }) => getArticlesByTag(query!, signal),
    enabled: query !== null,
  });
}
