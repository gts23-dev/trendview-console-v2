import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';
import { parseCount } from '@/shared/utils/format';
import { mediaHeaders } from '@/features/medias';

const countSchema = z.preprocess(parseCount, z.number());

export interface TagBusinessCount {
  tag: string;
  count: number;
}

const responseSchema = z.object({
  data: z.object({
    tag: z.array(z.object({ tag: z.string(), count: countSchema })).nullish(),
  }),
});

/**
 * 하단 "키워드(PK) 콘텐츠 매칭 순위" 표. 기존 콘솔은 같은 데이터로 태그
 * 네트워크 차트도 그렸지만, 차트는 표와 중복이라 이관에서 뺐다(사용자 확인).
 */
export async function getTagBusinessStats(
  mediaId: number,
  signal?: AbortSignal,
): Promise<TagBusinessCount[]> {
  const data = await request<unknown>(`api/v1/tags/stats?media_id=${mediaId}`, {
    headers: await mediaHeaders(mediaId, 'c9'),
    signal,
  });
  const parsed = responseSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('통계를 확인하지 못했습니다.', 'INVALID_RESPONSE');
  return (parsed.data.data.tag ?? []).map((item) => ({
    tag: item.tag,
    count: item.count,
  }));
}
