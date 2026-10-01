import { z } from 'zod';
import { PERIOD_CHOICES, type PeriodChoice } from '@/shared/utils/date-choice';
import { getWeekdayLabel, shiftDate, today } from '@/shared/utils/format';

// 콘텐츠 순위·일간 사용자 유입량과 같은 일/주/월 선택지를 쓴다. 세 feature
// 모두 shared에서 가져와 서로를 참조하지 않는다(다른 feature의 공개 배럴은
// hooks·api까지 딸려 있어, 모델 하나만 쓰려 해도 전부 로드된다).
export const RANK_DATE_CHOICES = PERIOD_CHOICES;
export type RankDateChoice = PeriodChoice;

export type TagRankSort = 'uv' | 'pv';

export const TAG_RANK_SORTS: { value: TagRankSort; label: string }[] = [
  { value: 'pv', label: 'PV 많은 순' },
  { value: 'uv', label: 'UV 많은 순' },
];

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const filtersSchema = z.object({
  dateChoice: z.enum(RANK_DATE_CHOICES).catch('daily'),
  sort: z.enum(['uv', 'pv']).catch('uv'),
  startDate: z.string().regex(DATE).catch(''),
  endDate: z.string().regex(DATE).catch(''),
});

export type TagRankFilters = z.infer<typeof filtersSchema>;

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
export function defaultRangeForTagRankChoice(choice: RankDateChoice) {
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

export function parseTagRankFilters(params: URLSearchParams): TagRankFilters {
  const dateChoice = params.get('dateChoice') ?? 'daily';
  const defaults = defaultRangeForTagRankChoice(
    RANK_DATE_CHOICES.includes(dateChoice as RankDateChoice)
      ? (dateChoice as RankDateChoice)
      : 'daily',
  );
  return filtersSchema.parse({
    dateChoice,
    sort: params.get('sort') ?? 'uv',
    startDate: params.get('start') ?? defaults.startDate,
    endDate: params.get('end') ?? defaults.endDate,
  });
}

export function serializeTagRankFilters(
  filters: TagRankFilters,
  base?: URLSearchParams,
) {
  const params = new URLSearchParams(base);
  const entries: [string, string][] = [
    ['dateChoice', filters.dateChoice === 'daily' ? '' : filters.dateChoice],
    ['sort', filters.sort === 'uv' ? '' : filters.sort],
    ['start', filters.startDate],
    ['end', filters.endDate],
  ];
  for (const [key, value] of entries) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  return params;
}

/**
 * 일간은 요일을 붙이고, 월간은 뒤에 '월'을 붙인다(둘 다 화면에서만 붙이던
 * 기존 콘솔의 표시 규칙). 주간은 서버 값을 그대로 둔다. 일간 사용자
 * 유입량과 달리 연도를 자르지 않는다 — 기존 콘솔의 화면별 substr 규칙이
 * 서로 다르다.
 */
export function formatTagRankDateLabel(
  dateType: string,
  dateChoice: RankDateChoice,
) {
  if (dateChoice === 'daily')
    return `${dateType}(${getWeekdayLabel(dateType)})`;
  if (dateChoice === 'monthly') return `${dateType} 월`;
  return dateType;
}
