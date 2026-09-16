import { useQuery } from '@tanstack/react-query';
import { getArticleReports } from '../api/article-reports';

export const articleReportKeys = {
  all: ['article-reports'] as const,
  list: (mediaId: number, id: number) =>
    [...articleReportKeys.all, mediaId, id] as const,
};

export function useArticleReports(mediaId: number | null, id: number | null) {
  return useQuery({
    queryKey: articleReportKeys.list(mediaId ?? 0, id ?? 0),
    queryFn: ({ signal }) => getArticleReports(id!, mediaId!, signal),
    enabled: mediaId !== null && id !== null,
  });
}
