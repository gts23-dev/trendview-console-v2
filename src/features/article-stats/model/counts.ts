import { z } from 'zod';
import { shiftDate, today } from '@/shared/utils/format';

/** 수집=0, 게시=1, 삭제=2, 신고=3. 기존 콘솔의 state 값과 같다. */
export const CONTENT_STATE = {
  collected: 0,
  posted: 1,
  deleted: 2,
  reported: 3,
} as const;
export type ContentState = (typeof CONTENT_STATE)[keyof typeof CONTENT_STATE];

export const DATE_CHOICES = ['daily', 'weekly', 'monthly', 'custom'] as const;
export type DateChoice = (typeof DATE_CHOICES)[number];

/** 활성/비활성 카드 라벨은 구간 선택에 따라 바뀐다. custom은 비교 대상이
 * 없어 두 번째 라벨이 없다. */
export function getActiveLabels(dateChoice: DateChoice) {
  switch (dateChoice) {
    case 'weekly':
      return { first: '이번 주', second: '지난주' };
    case 'monthly':
      return { first: '이번 달', second: '저번달' };
    case 'custom':
      return { first: '선택한 기간 동안', second: '' };
    default:
      return { first: '오늘', second: '어제' };
  }
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const filtersSchema = z.object({
  state: z.coerce.number().int().min(0).max(3).catch(CONTENT_STATE.collected),
  page: z.coerce.number().int().min(1).catch(1),
  startDate: z.string().regex(DATE).catch(''),
  endDate: z.string().regex(DATE).catch(''),
  dateChoice: z.enum(DATE_CHOICES).catch('daily'),
  activeStartDate: z.string().regex(DATE).catch(''),
  activeEndDate: z.string().regex(DATE).catch(''),
});

export type CountsFilters = z.infer<typeof filtersSchema>;

/** 일간 개수 표는 화면 안에서만 넘기는 쪽이라 URL에 남길 값이 아니다. */
export const DAILY_PAGE_SIZE = 10;

export function defaultCountsRange() {
  return { startDate: shiftDate(30), endDate: today() };
}

export function parseCountsFilters(params: URLSearchParams): CountsFilters {
  const defaults = defaultCountsRange();
  const todayDate = today();
  return filtersSchema.parse({
    state: params.get('state') ?? CONTENT_STATE.collected,
    page: params.get('page') ?? 1,
    startDate: params.get('start') ?? defaults.startDate,
    endDate: params.get('end') ?? defaults.endDate,
    dateChoice: params.get('choice') ?? 'daily',
    activeStartDate: params.get('activeStart') ?? todayDate,
    activeEndDate: params.get('activeEnd') ?? todayDate,
  });
}

/** 기본값(수집·일간·오늘)은 URL에 남기지 않아 주소를 짧게 유지한다. */
export function serializeCountsFilters(
  filters: CountsFilters,
  base?: URLSearchParams,
) {
  const params = new URLSearchParams(base);
  const entries: [string, string][] = [
    [
      'state',
      filters.state === CONTENT_STATE.collected ? '' : String(filters.state),
    ],
    ['page', filters.page > 1 ? String(filters.page) : ''],
    ['start', filters.startDate],
    ['end', filters.endDate],
    ['choice', filters.dateChoice === 'daily' ? '' : filters.dateChoice],
    ['activeStart', filters.activeStartDate],
    ['activeEnd', filters.activeEndDate],
  ];
  for (const [key, value] of entries) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  return params;
}

export function countDailyPages(totalCount: number) {
  return Math.max(1, Math.ceil(totalCount / DAILY_PAGE_SIZE));
}
