import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';
import { mediaHeaders } from './media-list';

const detailSchema = z.object({
  data: z.object({
    topics: z
      .array(z.object({ id: z.number(), topic: z.string().nullish() }))
      .nullish(),
  }),
});

/**
 * 매체 상세에 그 매체의 카테고리가 함께 온다. 기존 콘솔도 키워드(PK) 등록
 * 폼의 선택지를 `api/v1/topics`가 아니라 여기서 받는다. 쪽 나눔이 없다.
 */
export async function getMediaTopics(
  mediaId: number,
  signal?: AbortSignal,
): Promise<string[]> {
  const data = await request<unknown>(`api/v1/medias/${mediaId}`, {
    headers: await mediaHeaders(mediaId, 'c9'),
    signal,
  });
  const parsed = detailSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('매체 정보를 확인하지 못했습니다.', 'INVALID_RESPONSE');
  return (parsed.data.data.topics ?? [])
    .map((item) => item.topic ?? '')
    .filter(Boolean);
}
