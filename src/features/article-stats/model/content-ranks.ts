import { z } from 'zod';
import { PERIOD_CHOICES, type PeriodChoice } from '@/shared/utils/date-choice';
import { getWeekdayLabel, shiftDate, today } from '@/shared/utils/format';

export const CONTENT_RANK_SORTS = ['uv', 'pv'] as const;
export type ContentRankSort = (typeof CONTENT_RANK_SORTS)[number];

/** 이 화면은 수집/게시/신고 개수 화면과 달리 'custom'이 없다. 다른 통계
 * 화면(일간 사용자 유입량 등)과 같은 선택지를 쓰므로 shared에서 가져온다. */
export const RANK_DATE_CHOICES = PERIOD_CHOICES;
export type RankDateChoice = PeriodChoice;

// 이 화면에서만 쓰지만, 요일 계산 자체는 다른 통계 화면도 필요로 해서
// shared에 있다. 공개 진입점(index.ts)은 그대로 이 이름으로 다시 내보낸다.
export { getWeekdayLabel };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const filtersSchema = z.object({
  sort: z.enum(CONTENT_RANK_SORTS).catch('uv'),
  dateChoice: z.enum(RANK_DATE_CHOICES).catch('daily'),
  startDate: z.string().regex(DATE).catch(''),
  endDate: z.string().regex(DATE).catch(''),
});

export type ContentRankFilters = z.infer<typeof filtersSchema>;

/** 달력이 아니라 개월 수로 빼는 계산이라 `shiftDate`(일 단위)로는 못 만든다. */
function shiftMonths(months: number, from = new Date()) {
  const date = new Date(from);
  date.setMonth(date.getMonth() - months);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * 구간 선택(일/주/월)을 바꾸면 그 구간에 맞는 기본 기간으로 되돌아간다.
 * 기존 콘솔의 dateChoice watch와 같다(일=3일 전, 주=14주 전, 월=14개월 전).
 */
export function defaultRangeForRankChoice(choice: RankDateChoice) {
  const endDate = today();
  switch (choice) {
    case 'weekly':
      return { startDate: shiftDate(14 * 7), endDate };
    case 'monthly':
      return { startDate: shiftMonths(14), endDate };
    default:
      return { startDate: shiftDate(3), endDate };
  }
}

export function parseContentRankFilters(
  params: URLSearchParams,
): ContentRankFilters {
  const dateChoice = params.get('dateChoice') ?? 'daily';
  const defaults = defaultRangeForRankChoice(
    RANK_DATE_CHOICES.includes(dateChoice as RankDateChoice)
      ? (dateChoice as RankDateChoice)
      : 'daily',
  );
  return filtersSchema.parse({
    sort: params.get('sort') ?? 'uv',
    dateChoice,
    startDate: params.get('start') ?? defaults.startDate,
    endDate: params.get('end') ?? defaults.endDate,
  });
}

export function serializeContentRankFilters(
  filters: ContentRankFilters,
  base?: URLSearchParams,
) {
  const params = new URLSearchParams(base);
  const entries: [string, string][] = [
    ['sort', filters.sort === 'uv' ? '' : filters.sort],
    ['dateChoice', filters.dateChoice === 'daily' ? '' : filters.dateChoice],
    ['start', filters.startDate],
    ['end', filters.endDate],
  ];
  for (const [key, value] of entries) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  return params;
}

/** 일간은 요일을, 월간은 '월' 접미사를 붙인다. 기존 콘솔의 표시 규칙과 같다. */
export function formatBucketLabel(
  dateType: string,
  dateChoice: RankDateChoice,
) {
  if (dateChoice === 'daily')
    return `${dateType}(${getWeekdayLabel(dateType)})`;
  if (dateChoice === 'monthly') return `${dateType} 월`;
  return dateType;
}
