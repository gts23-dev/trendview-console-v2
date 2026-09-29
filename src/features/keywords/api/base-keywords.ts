import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';
import { mediaHeaders } from '@/features/medias';
import type { BaseKeywordFilters } from '../model/filters';
import { BASE_KEYWORD_PAGE_SIZE, splitKeywords } from '../model/filters';
import type { BaseKeywordListResult } from '../model/types';

const keywordSchema = z.object({
  id: z.number(),
  media_id: z.number().nullish(),
  keyword: z.string().nullish(),
  topic: z.string().nullish(),
  platform: z.array(z.string()).nullish(),
  state: z.union([z.boolean(), z.number()]).nullish(),
  created_at: z.string().nullish(),
});

const listSchema = z.object({
  data: z.object({
    count: z.number().nullish(),
    keywords: z.array(keywordSchema).nullish(),
  }),
});

export async function getBaseKeywords(
  filters: BaseKeywordFilters,
  mediaId: number,
  signal?: AbortSignal,
): Promise<BaseKeywordListResult> {
  const query = new URLSearchParams({
    media_id: String(mediaId),
    page: String(filters.page),
    per_page: String(BASE_KEYWORD_PAGE_SIZE),
    search: filters.search,
  });
  const data = await request<unknown>(`api/v1/base-keywords?${query}`, {
    headers: mediaHeaders(mediaId, 'c9'),
    signal,
  });
  const parsed = listSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('목록 응답을 확인하지 못했습니다.', 'INVALID_RESPONSE');
  return {
    items: (parsed.data.data.keywords ?? []).map((item) => ({
      id: item.id,
      mediaId: item.media_id ?? mediaId,
      keyword: item.keyword ?? '',
      topic: item.topic ?? '',
      platforms: item.platform ?? [],
      active: !!item.state,
      createdAt: item.created_at ?? '',
    })),
    totalCount: parsed.data.data.count ?? 0,
  };
}

export interface BaseKeywordInput {
  /** 없으면 등록, 있으면 수정이다. */
  id?: number;
  mediaId: number;
  keyword: string;
  topic: string;
  platforms: string[];
}

/**
 * 등록은 쉼표로 나눈 배열을, 수정은 문자열 하나를 보낸다. 기존 콘솔의 요청
 * 형태 그대로다. 저장에는 `c9` 헤더를 붙이지 않는다.
 */
export async function saveBaseKeyword({
  id,
  mediaId,
  keyword,
  topic,
  platforms,
}: BaseKeywordInput) {
  const body = {
    media_id: mediaId,
    platform: platforms,
    topic,
    keyword: id ? keyword : splitKeywords(keyword),
  };
  await request(id ? `api/v1/base-keywords/${id}` : 'api/v1/base-keywords', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(body),
  });
}

export async function toggleBaseKeywordState(id: number) {
  await request(`api/v1/base-keywords/toggle-state/${id}`, { method: 'PUT' });
}

/** 삭제는 경로의 id와 본문의 매체·키워드를 함께 보낸다. */
export async function deleteBaseKeyword({
  id,
  mediaId,
  keyword,
}: {
  id: number;
  mediaId: number;
  keyword: string;
}) {
  await request(`api/v1/base-keywords/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ media_id: mediaId, keyword }),
  });
}
