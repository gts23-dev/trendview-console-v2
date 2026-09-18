import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';
import { parseCount } from '@/shared/utils/format';
import { mediaHeaders } from '@/features/medias';
import type { VisitorFilters, VisitorRank } from '../model/visitors';

// 이 API 계열은 숫자를 "653"·"2,955"처럼 콤마 포함 문자열로 줄 때가 있어
// parseCount로 받는다(키워드(PK) 집계, 수집/게시/신고 개수에서 확인됨).
const visitSchema = z.object({
  key: z.string(),
  doc_count: z.preprocess(parseCount, z.number()),
});

const responseSchema = z.object({
  data: z.object({
    data: z.array(visitSchema),
  }),
});

export async function getVisitorRanks(
  filters: VisitorFilters,
  mediaId: number,
  signal?: AbortSignal,
): Promise<VisitorRank[]> {
  const params = new URLSearchParams({
    media_id: String(mediaId),
    start_date: filters.startDate,
    end_date: filters.endDate,
    sort: filters.sort,
  });
  const data = await request<unknown>(`api/v1/users/visit?${params}`, {
    headers: mediaHeaders(mediaId, 'c9'),
    signal,
  });
  const parsed = responseSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('목록 응답을 확인하지 못했습니다.', 'INVALID_RESPONSE');
  return parsed.data.data.data.map((item, index) => ({
    rank: index + 1,
    userId: item.key,
    count: item.doc_count,
  }));
}
