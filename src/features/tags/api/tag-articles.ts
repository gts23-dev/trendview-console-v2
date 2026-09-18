import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';
import { parseCount } from '@/shared/utils/format';
import {
  getMediaCode,
  getMediaStorageUrl,
  mediaHeaders,
} from '@/features/medias';
import {
  mapTagArticle,
  TAG_ARTICLE_PAGE_SIZE,
  type TagArticleListResult,
} from '../model/tag-articles';
import type { RankDateChoice } from '../model/tag-ranks';

const countSchema = z.preprocess(parseCount, z.number());

const articleSchema = z.object({
  id: z.number(),
  platform: z.string(),
  title: z.string().nullish(),
  contents: z.string().nullish(),
  business_tag: z.string().nullish(),
  storage_thumbnail_url: z.string().nullish(),
  thumbnail_url: z.string().nullish(),
  date: z.string().nullish(),
  article_medias: z
    .array(z.object({ storage_url: z.string().nullish() }))
    .nullish(),
});

const responseSchema = z.object({
  data: z.object({
    totalCount: countSchema.nullish(),
    articles: z.array(articleSchema).nullish(),
  }),
});

export interface TagArticlesQuery {
  tag: string;
  mediaId: number;
  dateChoice: RankDateChoice;
  /** 표시용 라벨이 아니라 서버가 보낸 원래 구간 값(bucket.dateType)이어야 한다. */
  searchDate: string;
  page: number;
}

export async function getArticlesByTag(
  query: TagArticlesQuery,
  signal?: AbortSignal,
): Promise<TagArticleListResult> {
  const params = new URLSearchParams({
    per_page: String(TAG_ARTICLE_PAGE_SIZE),
    tag: query.tag,
    media_id: String(query.mediaId),
    dateType: query.dateChoice,
    searchDate: query.searchDate,
    // 기존 콘솔은 이 값을 주석 처리해 실제로는 항상 1쪽만 받아 왔다(눌러도
    // 다음 쪽으로 안 넘어가는 버그). 여기서는 실제로 보낸다. (page 유무와
    // 무관하게 특정 태그·구간 조합에서 500이 나는 경우가 있음 — 서버 쪽
    // 문제로 확인됨, 아래 참고.)
    page: String(query.page),
  });
  const data = await request<unknown>(`api/v1/admin/articlesByTag?${params}`, {
    headers: mediaHeaders(query.mediaId, 'c9'),
    signal,
  });
  const parsed = responseSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('게시정보를 확인하지 못했습니다.', 'INVALID_RESPONSE');
  const storageBaseUrl = getMediaStorageUrl(getMediaCode(query.mediaId));
  return {
    items: (parsed.data.data.articles ?? []).map((item) =>
      mapTagArticle(item, storageBaseUrl),
    ),
    totalCount: parsed.data.data.totalCount ?? 0,
  };
}
