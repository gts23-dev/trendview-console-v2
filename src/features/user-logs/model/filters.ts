import { z } from 'zod';
import { shiftDate, today } from '@/shared/utils/format';

export const EVENT_FILTERS = ['visit', 'click', 'like', 'favorite'] as const;
export type EventFilter = (typeof EVENT_FILTERS)[number];

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const filtersSchema = z.object({
  platform: z.string().catch(''),
  event: z.enum(EVENT_FILTERS).or(z.literal('')).catch(''),
  articleId: z.string().trim().catch(''),
  userId: z.string().trim().catch(''),
  // 태그는 OR 검색이라 여러 개를 담을 수 있다(기존 콘솔의 v-combobox multiple).
  tags: z.array(z.string()).catch([]),
  without: z.coerce.boolean().catch(false),
  startDate: z.string().regex(DATE).catch(''),
  endDate: z.string().regex(DATE).catch(''),
});

export type UserLogFilters = z.infer<typeof filtersSchema>;

/**
 * 기존 콘솔은 `dayjs().set('date', -28)`를 썼는데, 이건 "28일 전"이 아니라
 * 이번 달 1일에서 28일을 더 뺀 날짜라 달마다 실제 일수가 들쭉날쭉하다(예:
 * 9월엔 8월 3일이 나와 46일 전이 됨). 다른 화면들의 기본 구간과 같은
 * 방식(shiftDate)으로 정리해 항상 정확히 28일 전을 기본값으로 쓴다.
 */
export function defaultUserLogRange() {
  return { startDate: shiftDate(28), endDate: today() };
}

export function parseUserLogFilters(params: URLSearchParams): UserLogFilters {
  const defaults = defaultUserLogRange();
  return filtersSchema.parse({
    platform: params.get('platform') ?? '',
    event: params.get('event') ?? '',
    articleId: params.get('article') ?? '',
    userId: params.get('user') ?? '',
    tags: params.getAll('tag'),
    without: params.get('without') === '1',
    startDate: params.get('start') ?? defaults.startDate,
    endDate: params.get('end') ?? defaults.endDate,
  });
}

export function serializeUserLogFilters(
  filters: UserLogFilters,
  base?: URLSearchParams,
) {
  const params = new URLSearchParams(base);
  params.delete('tag');
  const entries: [string, string][] = [
    ['platform', filters.platform],
    ['event', filters.event],
    ['article', filters.articleId],
    ['user', filters.userId],
    ['without', filters.without ? '1' : ''],
    ['start', filters.startDate],
    ['end', filters.endDate],
  ];
  for (const [key, value] of entries) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  for (const tag of filters.tags) params.append('tag', tag);
  return params;
}
