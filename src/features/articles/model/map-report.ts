import type { ArticleReport } from './types';

export interface ArticleReportData {
  user_id?: string | number | null;
  user_name?: string | null;
  type?: string | null;
  description?: string | null;
  created_at?: string | null;
}

export function mapArticleReport(
  data: ArticleReportData,
  index: number,
): ArticleReport {
  return {
    id: index,
    userId: data.user_id == null ? '' : String(data.user_id),
    userName: data.user_name ?? '',
    type: data.type ?? '',
    description: data.description ?? '',
    date: data.created_at ? data.created_at.slice(0, 10) : '',
  };
}
