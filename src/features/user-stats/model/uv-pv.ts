import { z } from 'zod';
import { PERIOD_CHOICES, type PeriodChoice } from '@/shared/utils/date-choice';
import { getWeekdayLabel, shiftDate, today } from '@/shared/utils/format';

// 콘텐츠 순위 화면과 같은 일/주/월 선택지를 쓴다. 두 feature 모두 shared에서
// 가져와 서로를 참조하지 않는다(다른 feature의 공개 배럴은 hooks·api까지
// 딸려 있어, 모델 하나만 쓰려 해도 전부 로드된다).
export const RANK_DATE_CHOICES = PERIOD_CHOICES;
export type RankDateChoice = PeriodChoice;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const filtersSchema = z.object({
  dateChoice: z.enum(RANK_DATE_CHOICES).catch('daily'),
  startDate: z.string().regex(DATE).catch(''),
  endDate: z.string().regex(DATE).catch(''),
});

export type UvPvFilters = z.infer<typeof filtersSchema>;

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
 * 기존 콘솔의 dateChoice watch와 같다(일=30일 전, 주=15주 전, 월=15개월 전).
 */
export function defaultRangeForUvPvChoice(choice: RankDateChoice) {
  const endDate = today();
  switch (choice) {
    case 'weekly':
      return { startDate: shiftDate(15 * 7), endDate };
    case 'monthly':
      return { startDate: shiftMonths(15), endDate };
    default:
      return { startDate: shiftDate(30), endDate };
  }
}

export function parseUvPvFilters(params: URLSearchParams): UvPvFilters {
  const dateChoice = params.get('dateChoice') ?? 'daily';
  const defaults = defaultRangeForUvPvChoice(
    RANK_DATE_CHOICES.includes(dateChoice as RankDateChoice)
      ? (dateChoice as RankDateChoice)
      : 'daily',
  );
  return filtersSchema.parse({
    dateChoice,
    startDate: params.get('start') ?? defaults.startDate,
    endDate: params.get('end') ?? defaults.endDate,
  });
}

export function serializeUvPvFilters(
  filters: UvPvFilters,
  base?: URLSearchParams,
) {
  const params = new URLSearchParams(base);
  const entries: [string, string][] = [
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

/**
 * 일간은 연도를 잘라 '월-일(요일)'로, 주간은 연도만 잘라 보여준다. 월간은
 * 그대로 두고 화면에서 ' 월' 접미사만 붙인다. 기존 콘솔의 substr 규칙을
 * 그대로 옮겼다 — 주간의 결과에 하이픈이 하나 남는 것까지 동일하다.
 */
export function formatUvPvDateLabel(
  dateType: string,
  dateChoice: RankDateChoice,
) {
  if (dateChoice === 'daily')
    return `${dateType.slice(5)}(${getWeekdayLabel(dateType)})`;
  if (dateChoice === 'weekly') return dateType.slice(4);
  return dateType;
}

export interface UvPvPoint {
  dateLabel: string;
  uvCount: number;
  pvCount: number;
  uvClickCount: number;
  /**
   * 기존 콘솔은 이 값을 표·차트에 'PV (클릭)'라고 표시하지만 실제로는
   * pv_count/uv_count 평균(주석 처리됨) 대신 서버의 article_count를 그대로
   * 보여준다. 라벨과 실제 값이 어긋난 상태를 그대로 옮긴다.
   */
  articleCount: number;
}

export interface UserPvEntry {
  userId: string;
  count: number;
  isMember: boolean;
}

export interface UserPvBucket {
  dateLabel: string;
  /** 응답에 users가 없으면 그 구간은 데이터 없음이다. */
  users: UserPvEntry[] | null;
}

export interface PlatformPvEntry {
  platform: string;
  count: number;
}

export interface PlatformPvBucket {
  dateLabel: string;
  platforms: PlatformPvEntry[] | null;
}
