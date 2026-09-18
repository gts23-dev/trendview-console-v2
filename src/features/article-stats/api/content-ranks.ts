import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';
import { parseCount } from '@/shared/utils/format';
import { mediaHeaders } from '@/features/medias';
import type { ContentRankFilters } from '../model/content-ranks';
import {
  mapContentRankBucket,
  normalizeRankSlots,
} from '../model/map-content-rank';
import type { ContentRankResult } from '../model/types';

const countSchema = z.preprocess(parseCount, z.number());

const articleRefSchema = z
  .object({
    id: z.number(),
    platform: z.string(),
    title: z.string().nullish(),
    contents: z.string().nullish(),
  })
  .nullable();

const rankSlotSchema = z.object({
  article: articleRefSchema,
  posted_article: z.unknown().nullish(),
  uv_count: countSchema,
  count: countSchema,
});

const bucketSchema = z.object({
  dateType: z.string(),
  // 순위 자리는 배열로 올 때도, 문자열 키를 가진 객체로 올 때도 있다.
  // 구간 끝의 빈 버킷은 이 필드 자체가 없다.
  articles: z
    .union([z.array(rankSlotSchema), z.record(z.string(), rankSlotSchema)])
    .nullish(),
});

const responseSchema = z.object({
  data: z.object({
    total: countSchema,
    data: z.array(bucketSchema),
  }),
});

export async function getContentRanks(
  filters: ContentRankFilters,
  mediaId: number,
  signal?: AbortSignal,
): Promise<ContentRankResult> {
  const params = new URLSearchParams({
    media_id: String(mediaId),
    start_date: filters.startDate,
    end_date: filters.endDate,
    date_choice: filters.dateChoice,
    sort: filters.sort,
  });
  const data = await request<unknown>(
    `api/v1/admin/articles/page-view-stats?${params}`,
    { headers: mediaHeaders(mediaId, 'TV'), signal },
  );
  const parsed = responseSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('순위를 확인하지 못했습니다.', 'INVALID_RESPONSE');
  return {
    buckets: parsed.data.data.data.map((item) =>
      mapContentRankBucket(
        {
          dateType: item.dateType,
          slots: normalizeRankSlots(item.articles).map((slot) => ({
            article: slot.article,
            postedArticle: slot.posted_article ?? null,
            uvCount: slot.uv_count,
            pvCount: slot.count,
          })),
        },
        filters.dateChoice,
      ),
    ),
    totalCount: parsed.data.data.total,
  };
}
