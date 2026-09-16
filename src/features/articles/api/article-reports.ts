import { z } from 'zod';
import { request } from '@/shared/api/client';
import { mediaHeaders } from '@/features/medias';
import { mapArticleReport, type ArticleReportData } from '../model/map-report';
import type { ArticleReport } from '../model/types';

const reportsSchema = z.object({
  data: z
    .array(
      z.object({
        user_id: z.union([z.string(), z.number()]).nullish(),
        user_name: z.string().nullish(),
        type: z.string().nullish(),
        description: z.string().nullish(),
        created_at: z.string().nullish(),
      }),
    )
    .nullish(),
});

/**
 * 콘텐츠에 달린 신고 목록. 대부분 0건이고 그때는 화면에 섹션을 띄우지 않는다.
 * 신고자 아이디·이름이 포함된 개인정보다.
 *
 * 콘텐츠 본문은 목록 응답이 전부 담고 있어 따로 조회하지 않는다. 기존 콘솔이
 * 쓰던 `articles/{id}/detail`은 목록에 없는 필드를 주지 않는다.
 */
export async function getArticleReports(
  id: number,
  mediaId: number,
  signal?: AbortSignal,
): Promise<ArticleReport[]> {
  const data = await request<unknown>(`api/v1/article-reports/${id}`, {
    headers: mediaHeaders(mediaId),
    signal,
  });
  const parsed = reportsSchema.safeParse(data);
  if (!parsed.success) return [];
  return (parsed.data.data ?? []).map((report, index) =>
    mapArticleReport(report as ArticleReportData, index),
  );
}
