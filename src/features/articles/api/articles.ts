import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';
import {
  getMediaCode,
  getMediaStorageUrl,
  mediaHeaders,
} from '@/features/medias';
import type { ArticleFilters } from '../model/filters';
import { toArticleQuery } from '../model/filters';
import { mapArticle, type ArticleData } from '../model/map-article';
import type { ArticleListResult } from '../model/types';

// 화면이 쓰는 필드만 검증한다. 응답에 더 많은 필드가 와도 통과시키고, 기존
// 콘솔이 없을 수 있다고 다루던 필드는 nullish로 둔다.
const articleSchema = z.object({
  id: z.number(),
  platform: z.string(),
  type: z.string().nullish(),
  keyword: z.string().nullish(),
  channel: z.string().nullish(),
  topic: z.string().nullish(),
  title: z.string().nullish(),
  contents: z.string().nullish(),
  url: z.string().nullish(),
  storage_thumbnail_url: z.string().nullish(),
  thumbnail_url: z.string().nullish(),
  thumbnail_width: z.number().nullish(),
  thumbnail_height: z.number().nullish(),
  business_tag: z.string().nullish(),
  state: z.number().nullish(),
  view_count: z.number().nullish(),
  date: z.string().nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
  article_owner: z.object({ name: z.string().nullish() }).nullish(),
  hashtag: z.string().nullish(),
  article_medias: z
    .array(
      z.object({
        type: z.string().nullish(),
        url: z.string().nullish(),
        storage_url: z.string().nullish(),
        width: z.number().nullish(),
        height: z.number().nullish(),
      }),
    )
    .nullish(),
});

const listSchema = z.object({
  data: z.object({
    totalCount: z.number().nullish(),
    searchCount: z.number().nullish(),
    articles: z.array(articleSchema),
  }),
});

/** 수집정보는 state 0, 게시정보는 state 1을 사용한다. */
export const ARTICLE_STATE = { collected: 0, posted: 1 } as const;

const LIST_PATHS: Record<number, string> = {
  [ARTICLE_STATE.collected]: 'api/v1/admin/articles',
  [ARTICLE_STATE.posted]: 'api/v1/admin/post-articles',
};

export async function getArticles(
  filters: ArticleFilters,
  mediaId: number,
  state: number,
  signal?: AbortSignal,
): Promise<ArticleListResult> {
  const query = toArticleQuery(filters, mediaId, state);
  const data = await request<unknown>(`${LIST_PATHS[state]}?${query}`, {
    headers: mediaHeaders(mediaId),
    signal,
  });
  const parsed = listSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('목록 응답을 확인하지 못했습니다.', 'INVALID_RESPONSE');
  const storageBaseUrl = getMediaStorageUrl(getMediaCode(mediaId));
  return {
    items: parsed.data.data.articles.map((article) =>
      mapArticle(article as ArticleData, storageBaseUrl, filters.sort),
    ),
    totalCount: parsed.data.data.totalCount ?? 0,
    searchCount: parsed.data.data.searchCount ?? 0,
  };
}
