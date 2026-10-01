import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';
import { parseCount } from '@/shared/utils/format';
import { mediaHeaders } from '@/features/medias';
import {
  CONTENT_STATE,
  type ContentState,
  type CountsFilters,
} from '../model/counts';
import { mapDailyPlatformCount } from '../model/map-daily';
import { orderPlatformCounts } from '../model/platforms';
import type {
  ArticleCounts,
  DailyPlatformCount,
  PlatformCount,
} from '../model/types';

// 이 화면의 세 API는 기존 콘솔에서도 `tv` 헤더(대소문자만 다름, HTTP 헤더는
// 대소문자를 구분하지 않는다)를 쓴다. 같은 통계 메뉴라도 화면마다 헤더 이름이
// 다를 수 있어 media-codes.ts의 일반 설명과 다르게 여기서는 'TV'를 쓴다.
const HEADER_NAME = 'TV';

// 숫자 필드가 "2,955"처럼 콤마 포함 문자열이거나 아예 없을 때가 있어
// parseCount로 받는다(수집/게시/신고 개수의 platform-stats에서 확인됨).
const countSchema = z.preprocess(parseCount, z.number());

const articleCountsSchema = z.object({
  data: z.object({
    inactive: countSchema,
    active: countSchema,
    report: countSchema,
    reportBlock: countSchema,
    todayInactive: countSchema,
    yesterdayInactive: countSchema,
    todayActive: countSchema,
    yesterdayActive: countSchema,
  }),
});

export async function getArticleCounts(
  filters: CountsFilters,
  mediaId: number,
  signal?: AbortSignal,
): Promise<ArticleCounts> {
  const params = new URLSearchParams({
    media_id: String(mediaId),
    dateChoice: filters.dateChoice,
    choice_start_date: filters.activeStartDate,
    choice_end_date: filters.activeEndDate,
  });
  const data = await request<unknown>(`api/v1/admin/articles/stats?${params}`, {
    headers: await mediaHeaders(mediaId, HEADER_NAME),
    signal,
  });
  const parsed = articleCountsSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('통계를 확인하지 못했습니다.', 'INVALID_RESPONSE');
  const d = parsed.data.data;
  return {
    inactive: d.inactive ?? 0,
    active: d.active ?? 0,
    report: d.report ?? 0,
    reportBlock: d.reportBlock ?? 0,
    todayInactive: d.todayInactive ?? 0,
    yesterdayInactive: d.yesterdayInactive ?? 0,
    todayActive: d.todayActive ?? 0,
    yesterdayActive: d.yesterdayActive ?? 0,
  };
}

const platformCountSchema = z.object({
  platform: z.string(),
  cnt: countSchema,
});

const platformCountsSchema = z.object({
  data: z.array(platformCountSchema),
});

const PLATFORM_COUNT_PATHS: Record<ContentState, string> = {
  [CONTENT_STATE.collected]: 'api/v1/admin/articles/platform-stats',
  [CONTENT_STATE.posted]: 'api/v1/admin/articles/platform-stats',
  [CONTENT_STATE.deleted]: 'api/v1/admin/articles/platform-stats',
  [CONTENT_STATE.reported]: 'api/v1/admin/article-reports/platform-stats',
};

export async function getPlatformCounts(
  state: ContentState,
  mediaId: number,
  signal?: AbortSignal,
): Promise<PlatformCount[]> {
  const params = new URLSearchParams({ media_id: String(mediaId) });
  // 신고 집계는 매체 하나로 상태를 나누지 않는다. 기존 콘솔도 이 요청에만
  // state를 보내지 않는다.
  if (state !== CONTENT_STATE.reported) params.set('state', String(state));

  const data = await request<unknown>(
    `${PLATFORM_COUNT_PATHS[state]}?${params}`,
    { headers: await mediaHeaders(mediaId, HEADER_NAME), signal },
  );
  const parsed = platformCountsSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('통계를 확인하지 못했습니다.', 'INVALID_RESPONSE');
  return orderPlatformCounts(
    parsed.data.data.map((item) => ({
      platform: item.platform,
      count: item.cnt ?? 0,
    })),
  );
}

const dailyItemSchema = z.object({
  date: z.string(),
  instagram: countSchema,
  youtube: countSchema,
  naverBlog: countSchema,
  twitter: countSchema,
  googleNews: countSchema,
  naverNews: countSchema,
});

const dailyCountsSchema = z.object({
  data: z.array(dailyItemSchema),
});

const DAILY_COUNT_PATHS: Record<ContentState, string> = {
  [CONTENT_STATE.collected]: 'api/v1/admin/articles/platform-daily-stats',
  [CONTENT_STATE.posted]: 'api/v1/admin/articles/platform-daily-stats',
  [CONTENT_STATE.deleted]: 'api/v1/admin/articles/platform-daily-stats',
  [CONTENT_STATE.reported]: 'api/v1/admin/article-reports/platform-daily-stats',
};

export async function getDailyPlatformCounts(
  filters: CountsFilters,
  state: ContentState,
  mediaId: number,
  signal?: AbortSignal,
): Promise<DailyPlatformCount[]> {
  const params = new URLSearchParams({
    media_id: String(mediaId),
    start_date: filters.startDate,
    end_date: filters.endDate,
  });
  if (state !== CONTENT_STATE.reported) params.set('state', String(state));

  const data = await request<unknown>(`${DAILY_COUNT_PATHS[state]}?${params}`, {
    headers: await mediaHeaders(mediaId, HEADER_NAME),
    signal,
  });
  const parsed = dailyCountsSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('통계를 확인하지 못했습니다.', 'INVALID_RESPONSE');
  return parsed.data.data.map((item) =>
    mapDailyPlatformCount({
      date: item.date,
      instagram: item.instagram ?? 0,
      youtube: item.youtube ?? 0,
      naverBlog: item.naverBlog ?? 0,
      twitter: item.twitter ?? 0,
      googleNews: item.googleNews ?? 0,
      naverNews: item.naverNews ?? 0,
    }),
  );
}
