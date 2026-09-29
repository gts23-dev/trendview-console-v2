import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';
import { createMediaCodes } from '../model/media-codes';

const listSchema = z.object({
  data: z.array(z.object({ id: z.number(), schema: z.string().nullish() })),
});

/**
 * 매체 목록. `schema`가 매체 헤더에 쓰는 영문 코드의 출처다. 사용자가 볼 수
 * 있는 매체만 오는 것이 아니라 전체가 오므로 선택지로 쓰지 않는다.
 */
export async function getMedias() {
  const data = await request<unknown>('api/v1/medias');
  const parsed = listSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('매체 목록을 확인하지 못했습니다.', 'INVALID_RESPONSE');
  return parsed.data.data;
}

export const { getMediaCode, mediaHeaders } = createMediaCodes(getMedias);
