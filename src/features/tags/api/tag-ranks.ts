import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';
import { parseCount } from '@/shared/utils/format';
import { toOrderedList } from '@/shared/utils/ordered-list';
import { mediaHeaders } from '@/features/medias';
import { mapTagRankBucket, type TagRankBucket } from '../model/map-tag-rank';
import type { TagRankFilters } from '../model/tag-ranks';

const countSchema = z.preprocess(parseCount, z.number());

const tagSlotSchema = z.object({
  tag: z.string(),
  uv_count: countSchema,
  count: countSchema,
});

// 다른 통계 화면(콘텐츠 순위 등)에서 확인된 것처럼, 구간에 따라 배열 또는
// 문자열 키 객체로 올 수 있다.
const tagBucketSchema = z.object({
  dateType: z.string(),
  tags: z
    .union([z.array(tagSlotSchema), z.record(z.string(), tagSlotSchema)])
    .nullish(),
});

const responseSchema = z.object({
  data: z.object({ data: z.array(tagBucketSchema) }),
});

export async function getTagDailyStats(
  filters: TagRankFilters,
  mediaId: number,
  signal?: AbortSignal,
): Promise<TagRankBucket[]> {
  const params = new URLSearchParams({
    media_id: String(mediaId),
    start_date: filters.startDate,
    end_date: filters.endDate,
    date_choice: filters.dateChoice,
    sort: filters.sort,
  });
  const data = await request<unknown>(`api/v1/tags/daily-stats?${params}`, {
    headers: mediaHeaders(mediaId, 'c9'),
    signal,
  });
  const parsed = responseSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('통계를 확인하지 못했습니다.', 'INVALID_RESPONSE');
  return parsed.data.data.data.map((bucket) =>
    mapTagRankBucket(
      {
        dateType: bucket.dateType,
        slots: toOrderedList(bucket.tags).map((slot) => ({
          tag: slot.tag,
          uvCount: slot.uv_count,
          pvCount: slot.count,
        })),
      },
      filters.dateChoice,
    ),
  );
}
