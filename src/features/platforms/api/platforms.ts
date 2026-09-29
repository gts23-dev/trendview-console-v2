import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';

const listSchema = z.object({
  data: z.object({
    platforms: z.array(
      z.object({
        platform: z.string(),
        platform_kr: z.string().nullish(),
      }),
    ),
  }),
});

export interface Platform {
  /** 요청에 담기는 영문 이름. */
  name: string;
  label: string;
}

/** 사용 중인 플랫폼만 받는다. 키워드(PK) 등록 폼의 선택지다. */
export async function getActivePlatforms(
  signal?: AbortSignal,
): Promise<Platform[]> {
  const data = await request<unknown>('api/v1/platforms?state=1', { signal });
  const parsed = listSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError(
      '플랫폼 목록을 확인하지 못했습니다.',
      'INVALID_RESPONSE',
    );
  return parsed.data.data.platforms.map((item) => ({
    name: item.platform,
    label: item.platform_kr || item.platform,
  }));
}
