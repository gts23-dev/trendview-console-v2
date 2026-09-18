import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';
import { parseCount } from '@/shared/utils/format';
import { toOrderedList } from '@/shared/utils/ordered-list';
import { mediaHeaders } from '@/features/medias';
import {
  mapUserSearchArticles,
  mapUserSearchEvents,
  mapUserSearchPlatforms,
  mapUserSearchTags,
  type UserSearchArticleRank,
  type UserSearchEventCount,
  type UserSearchPlatformCount,
  type UserSearchTagRank,
} from '../model/map-user-search';
import type { UserSearchFilters } from '../model/user-search';

const countSchema = z.preprocess(parseCount, z.number());

const bucketSchema = z.object({ key: z.string(), doc_count: countSchema });

const articleDataSchema = z.object({
  platform: z.string(),
  title: z.string().nullish(),
  contents: z.string().nullish(),
});

// article_data가 없는 항목이 있다(원본 콘텐츠가 지워진 경우). 기존 콘솔도
// 이때는 아이콘 없이 글번호만 보여준다.
const articleEntrySchema = z.object({
  key: z.string(),
  doc_count: countSchema,
  article_data: articleDataSchema.nullish(),
});

// tags 필드는 이 화면만 key/doc_count가 아니라 tag/priority를 쓴다(기존
// 콘솔에 주석 처리된 옛 필드명이 남아 있어 확인함).
const tagEntrySchema = z.object({ tag: z.string(), priority: countSchema });

const responseSchema = z.object({
  data: z.object({
    data: z.object({
      count: z.array(bucketSchema).nullish(),
      // 다른 통계 화면과 같은 특성(구간에 따라 배열/객체로 바뀔 수 있음)이
      // 여기서도 나올 가능성이 있어 방어적으로 둘 다 받는다.
      articles: z
        .union([
          z.array(articleEntrySchema),
          z.record(z.string(), articleEntrySchema),
        ])
        .nullish(),
      platform_count: z.array(bucketSchema).nullish(),
      tags: z.array(tagEntrySchema).nullish(),
    }),
  }),
});

export interface UserSearchResult {
  events: UserSearchEventCount[];
  platforms: UserSearchPlatformCount[];
  articles: UserSearchArticleRank[];
  tags: UserSearchTagRank[];
}

export async function getUserSearchDetail(
  filters: UserSearchFilters,
  mediaId: number,
  signal?: AbortSignal,
): Promise<UserSearchResult> {
  const params = new URLSearchParams({
    media_id: String(mediaId),
    start_date: filters.startDate,
    end_date: filters.endDate,
  });
  const data = await request<unknown>(
    `api/v1/users/search-detail/${encodeURIComponent(filters.search)}?${params}`,
    { headers: mediaHeaders(mediaId, 'c9'), signal },
  );
  const parsed = responseSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('검색 결과를 확인하지 못했습니다.', 'INVALID_RESPONSE');
  const result = parsed.data.data.data;
  return {
    events: mapUserSearchEvents(
      (result.count ?? []).map((item) => ({
        key: item.key,
        count: item.doc_count,
      })),
    ),
    platforms: mapUserSearchPlatforms(
      (result.platform_count ?? []).map((item) => ({
        key: item.key,
        count: item.doc_count,
      })),
    ),
    articles: mapUserSearchArticles(
      toOrderedList(result.articles).map((item) => ({
        articleId: Number(item.key),
        count: item.doc_count,
        articleData: item.article_data
          ? {
              platform: item.article_data.platform,
              title: item.article_data.title,
              contents: item.article_data.contents,
            }
          : null,
      })),
    ),
    tags: mapUserSearchTags(
      (result.tags ?? []).map((item) => ({
        tag: item.tag,
        count: item.priority,
      })),
    ),
  };
}
