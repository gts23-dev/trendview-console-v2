import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';
import { mediaHeaders } from '@/features/medias';
import type { TagIgnoreFilters } from '../model/filters';
import { TAG_IGNORE_PAGE_SIZE } from '../model/filters';
import type { TagIgnoreListResult } from '../model/types';

const tagSchema = z.object({
  id: z.number(),
  media_id: z.number().nullish(),
  media_name: z.string().nullish(),
  tag: z.string().nullish(),
  is_ignore: z.union([z.boolean(), z.number()]).nullish(),
});

const listSchema = z.object({
  data: z.object({
    count: z.number().nullish(),
    tags: z.array(tagSchema).nullish(),
  }),
});

export async function getTagIgnores(
  filters: TagIgnoreFilters,
  mediaId: number,
  signal?: AbortSignal,
): Promise<TagIgnoreListResult> {
  // 이 API만 per_page가 아니라 perPage다. 기존 요청 형태를 그대로 쓴다.
  const query = new URLSearchParams({
    media_id: String(mediaId),
    page: String(filters.page),
    perPage: String(TAG_IGNORE_PAGE_SIZE),
    search: filters.search,
  });
  // 전체를 볼 때는 조건 자체를 보내지 않는다. 기존 콘솔도 null을 빼고 보낸다.
  if (filters.ignore) query.set('is_ignore', filters.ignore);
  const data = await request<unknown>(`api/v1/tags/ignore?${query}`, {
    headers: mediaHeaders(mediaId, 'c9'),
    signal,
  });
  const parsed = listSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('목록 응답을 확인하지 못했습니다.', 'INVALID_RESPONSE');
  return {
    items: (parsed.data.data.tags ?? []).map((item) => ({
      id: item.id,
      mediaId: item.media_id ?? mediaId,
      mediaName: item.media_name ?? '',
      tag: item.tag ?? '',
      ignore: !!item.is_ignore,
    })),
    totalCount: parsed.data.data.count ?? 0,
  };
}

export async function toggleTagIgnore(id: number) {
  await request(`api/v1/tags/ignore/toggle-ignore/${id}`, { method: 'PUT' });
}

/** 삭제는 본문에 배열을 담는다. 기존 콘솔도 한 건씩 배열로 보낸다. */
export async function deleteTagIgnore({
  mediaId,
  tag,
}: {
  mediaId: number;
  tag: string;
}) {
  await request('api/v1/tags/ignore', {
    method: 'DELETE',
    body: JSON.stringify([{ media_id: mediaId, tag }]),
  });
}
