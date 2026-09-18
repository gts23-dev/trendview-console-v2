import { z } from 'zod';
import { request } from '@/shared/api/client';
import { ApiError, AppError } from '@/shared/errors/app-error';
import { parseCount } from '@/shared/utils/format';
import type { UserLogFilters } from '../model/filters';
import { mapUserLog, type UserLogEntry } from '../model/map-log';

export const USER_LOG_PAGE_SIZE = 100;

const countSchema = z.preprocess(parseCount, z.number());

const logSchema = z.object({
  platform: z.string(),
  article_id: z.union([z.number(), z.string()]).nullish(),
  event: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
  user_id: z.string(),
  created_at: z.string(),
  device: z.object({ adid: z.string().nullish() }).nullish(),
});

// search_after는 ES 정렬 커서라 문자열이 아니라 숫자(타임스탬프)로 오기도
// 한다. 실제 응답은 숫자였다 — 문자열로만 받게 해 둬서 INVALID_RESPONSE가
// 났었다. 받은 타입 그대로 다음 요청에 돌려보낸다(문자열로 바꿔 보내면
// 서버가 다르게 해석할 위험이 있어 임의 변환하지 않는다).
const cursorSchema = z.union([z.string(), z.number()]);

const responseSchema = z.object({
  data: z.object({
    data: z.array(logSchema),
    total_count: countSchema,
    total_unique_count: countSchema.nullish(),
    search_after: cursorSchema.nullish(),
  }),
});

export type UserLogCursor = z.infer<typeof cursorSchema>;

export interface UserLogPage {
  items: UserLogEntry[];
  totalCount: number;
  uniqueCount: number | null;
  nextCursor: UserLogCursor | null;
}

// 검색 조건 하나하나는 배열 값이지만, event만 예외로 문자열 하나를 그대로
// 보낸다 — 기존 콘솔의 실제 요청 모양이라 그대로 옮긴다.
type SearchClause =
  | { field: 'media_id'; value: number[] }
  | { field: 'platform' | 'article_id' | 'user_id'; value: string[] }
  | { field: 'tags'; value: string[] }
  | { field: 'event'; value: string };

function buildSearch(filters: UserLogFilters, mediaId: number): SearchClause[] {
  const search: SearchClause[] = [{ field: 'media_id', value: [mediaId] }];
  if (filters.platform)
    search.push({ field: 'platform', value: [filters.platform] });
  if (filters.event) search.push({ field: 'event', value: filters.event });
  if (filters.tags.length > 0)
    search.push({ field: 'tags', value: filters.tags });
  if (filters.articleId)
    search.push({ field: 'article_id', value: [filters.articleId] });
  if (filters.userId)
    search.push({ field: 'user_id', value: [filters.userId] });
  return search;
}

export async function getUserLogs(
  filters: UserLogFilters,
  mediaId: number,
  cursor: UserLogCursor | null,
  signal?: AbortSignal,
): Promise<UserLogPage> {
  const body = JSON.stringify({
    start_date: filters.startDate,
    end_date: filters.endDate,
    per_page: USER_LOG_PAGE_SIZE,
    search: buildSearch(filters, mediaId),
    without: filters.without,
    sort: [{ field: 'created_at', order: 'desc' }],
    ...(cursor !== null ? { search_after: cursor } : {}),
  });

  let data: unknown;
  try {
    data = await request<unknown>('api/v1/admin/log', {
      method: 'POST',
      body,
      signal,
    });
  } catch (error) {
    // 검색 결과가 없으면 서버가 200이 아니라 404를 준다(기존 콘솔도 이때는
    // 에러로 다루지 않고 그냥 빈 결과로 본다).
    if (error instanceof ApiError && error.status === 404)
      return { items: [], totalCount: 0, uniqueCount: null, nextCursor: null };
    throw error;
  }

  const parsed = responseSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('접속 로그를 확인하지 못했습니다.', 'INVALID_RESPONSE');
  return {
    items: parsed.data.data.data.map((item) => mapUserLog(item)),
    totalCount: parsed.data.data.total_count,
    uniqueCount: parsed.data.data.total_unique_count ?? null,
    nextCursor: parsed.data.data.search_after ?? null,
  };
}
