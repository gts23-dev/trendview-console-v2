import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';
import { mediaHeaders } from '@/features/medias';
import type { TopicFilters } from '../model/filters';
import { TOPIC_PAGE_SIZE } from '../model/filters';
import type { TopicListResult } from '../model/types';

const topicSchema = z.object({
  id: z.number(),
  media_id: z.number().nullish(),
  topic: z.string().nullish(),
  created_at: z.string().nullish(),
});

const listSchema = z.object({
  data: z.object({
    totalCount: z.number().nullish(),
    topics: z.array(topicSchema),
  }),
});

export async function getTopics(
  filters: TopicFilters,
  mediaId: number,
  signal?: AbortSignal,
): Promise<TopicListResult> {
  const query = new URLSearchParams({
    media_id: String(mediaId),
    page: String(filters.page),
    per_page: String(TOPIC_PAGE_SIZE),
    search: filters.search,
  });
  const data = await request<unknown>(`api/v1/topics?${query}`, {
    headers: mediaHeaders(mediaId, 'c9'),
    signal,
  });
  const parsed = listSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('목록 응답을 확인하지 못했습니다.', 'INVALID_RESPONSE');
  return {
    items: parsed.data.data.topics.map((item) => ({
      id: item.id,
      mediaId: item.media_id ?? mediaId,
      topic: item.topic ?? '',
      createdAt: item.created_at ?? '',
    })),
    totalCount: parsed.data.data.totalCount ?? 0,
  };
}

export interface TopicInput {
  /** 없으면 등록, 있으면 수정이다. */
  id?: number;
  mediaId: number;
  topic: string;
}

/** 저장에는 `c9` 헤더를 붙이지 않는다. 기존 콘솔이 조회에만 보낸다. */
export async function saveTopic({ id, mediaId, topic }: TopicInput) {
  const body = JSON.stringify({ media_id: mediaId, topic });
  await request(id ? `api/v1/topics/${id}` : 'api/v1/topics', {
    method: id ? 'PUT' : 'POST',
    body,
  });
}
