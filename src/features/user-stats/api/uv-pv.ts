import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';
import { parseCount } from '@/shared/utils/format';
import { toOrderedList } from '@/shared/utils/ordered-list';
import { mediaHeaders } from '@/features/medias';
import { formatUvPvDateLabel, type UvPvFilters } from '../model/uv-pv';
import type { PlatformPvBucket, UserPvBucket, UvPvPoint } from '../model/uv-pv';

const countSchema = z.preprocess(parseCount, z.number());

function buildParams(filters: UvPvFilters, mediaId: number) {
  return new URLSearchParams({
    media_id: String(mediaId),
    start_date: filters.startDate,
    end_date: filters.endDate,
    date_choice: filters.dateChoice,
  });
}

const uvPvItemSchema = z.object({
  dateType: z.string(),
  uv_count: countSchema,
  pv_count: countSchema,
  article_unique_count: countSchema,
  article_count: countSchema,
});

const uvPvResponseSchema = z.object({
  data: z.object({ data: z.array(uvPvItemSchema) }),
});

export async function getUvPvStats(
  filters: UvPvFilters,
  mediaId: number,
  signal?: AbortSignal,
): Promise<UvPvPoint[]> {
  const data = await request<unknown>(
    `api/v1/stats/uv-pv-stats?${buildParams(filters, mediaId)}`,
    { headers: mediaHeaders(mediaId), signal },
  );
  const parsed = uvPvResponseSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('통계를 확인하지 못했습니다.', 'INVALID_RESPONSE');
  return parsed.data.data.data.map((item) => ({
    dateLabel: formatUvPvDateLabel(item.dateType, filters.dateChoice),
    uvCount: item.uv_count,
    pvCount: item.pv_count,
    uvClickCount: item.article_unique_count,
    articleCount: item.article_count,
  }));
}

const userEntrySchema = z.object({
  user_id: z.string(),
  count: countSchema,
  is_member: z.boolean().nullish(),
});

// 순위 자리와 마찬가지로 배열 또는 문자열 키 객체로 올 수 있다(콘텐츠
// 순위에서 확인됨).
const userBucketSchema = z.object({
  dateType: z.string(),
  users: z
    .union([z.array(userEntrySchema), z.record(z.string(), userEntrySchema)])
    .nullish(),
});

const userPvResponseSchema = z.object({
  data: z.object({ data: z.array(userBucketSchema) }),
});

export async function getUserPageViewStats(
  filters: UvPvFilters,
  mediaId: number,
  signal?: AbortSignal,
): Promise<UserPvBucket[]> {
  const data = await request<unknown>(
    `api/v1/users/page-view-stats?${buildParams(filters, mediaId)}`,
    { headers: mediaHeaders(mediaId), signal },
  );
  const parsed = userPvResponseSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('통계를 확인하지 못했습니다.', 'INVALID_RESPONSE');
  return parsed.data.data.data.map((item) => ({
    dateLabel: formatUvPvDateLabel(item.dateType, filters.dateChoice),
    users: item.users
      ? toOrderedList(item.users).map((user) => ({
          userId: user.user_id,
          count: user.count,
          isMember: user.is_member ?? false,
        }))
      : null,
  }));
}

const platformEntrySchema = z.object({
  platform: z.string(),
  count: countSchema,
});

const platformBucketSchema = z.object({
  dateType: z.string(),
  platforms: z
    .union([
      z.array(platformEntrySchema),
      z.record(z.string(), platformEntrySchema),
    ])
    .nullish(),
});

const platformPvResponseSchema = z.object({
  data: z.object({ data: z.array(platformBucketSchema) }),
});

export async function getPlatformPageViewStats(
  filters: UvPvFilters,
  mediaId: number,
  signal?: AbortSignal,
): Promise<PlatformPvBucket[]> {
  const data = await request<unknown>(
    `api/v1/platforms/page-view-stats?${buildParams(filters, mediaId)}`,
    { headers: mediaHeaders(mediaId), signal },
  );
  const parsed = platformPvResponseSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('통계를 확인하지 못했습니다.', 'INVALID_RESPONSE');
  return parsed.data.data.data.map((item) => ({
    dateLabel: formatUvPvDateLabel(item.dateType, filters.dateChoice),
    platforms: item.platforms ? toOrderedList(item.platforms) : null,
  }));
}
