import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';
import { parseCount } from '@/shared/utils/format';
import { mediaHeaders } from '@/features/medias';
import { TAG_TOTAL_PAGE_SIZE, type TagTotalFilters } from '../model/filters';
import type { TagTotalListResult } from '../model/types';

// 서버가 sum·total을 "653"·"2,955"처럼 콤마 포함 숫자 문자열로 줄 때가 있어
// parseCount로 받는다.
const countSchema = z.preprocess(parseCount, z.number());

const tagTotalSchema = z.object({
  name: z.string().nullish(),
  tag: z.string(),
  sum: countSchema,
});

const listSchema = z.object({
  data: z.object({
    total: countSchema,
    tags: z.array(tagTotalSchema),
  }),
});

export async function getTagTotals(
  filters: TagTotalFilters,
  mediaId: number,
  signal?: AbortSignal,
): Promise<TagTotalListResult> {
  const params = new URLSearchParams({
    media_id: String(mediaId),
    page: String(filters.page),
    per_page: String(TAG_TOTAL_PAGE_SIZE),
    search: filters.search,
    tag_order: filters.tagOrder,
  });
  // 기존 콘솔의 axios params 표기(date_range[start_at])를 그대로 쓴다.
  params.set('date_range[start_at]', filters.startDate);
  params.set('date_range[end_at]', filters.endDate);
  if (filters.sumOrder) params.set('sum_order', filters.sumOrder);

  const data = await request<unknown>(`api/v1/tags/total?${params}`, {
    headers: mediaHeaders(mediaId, 'c9'),
    signal,
  });
  const parsed = listSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('목록 응답을 확인하지 못했습니다.', 'INVALID_RESPONSE');
  return {
    items: parsed.data.data.tags.map((item) => ({
      mediaName: item.name ?? '',
      tag: item.tag,
      count: item.sum ?? 0,
    })),
    totalCount: parsed.data.data.total ?? 0,
  };
}
