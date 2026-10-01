import { z } from 'zod';
import { shiftDate, today } from '@/shared/utils/format';

/** 기존 콘솔과 같은 16개다. */
export const TAG_IGNORE_PAGE_SIZE = 16;

/** 제외 적용 여부 필터. 빈 값이면 서버에 조건을 보내지 않는다. */
export const IGNORE_FILTERS = [
  { value: '', label: '전체' },
  { value: '1', label: '적용' },
  { value: '0', label: '적용 안함' },
] as const;

const tagIgnoreFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(100).catch(''),
  ignore: z.enum(['', '1', '0']).catch(''),
});

export type TagIgnoreFilters = z.infer<typeof tagIgnoreFiltersSchema>;

/** URL은 사용자가 고칠 수 있는 외부 입력이다. 잘못된 값은 기본값으로 돌린다. */
export function parseTagIgnoreFilters(
  params: URLSearchParams,
): TagIgnoreFilters {
  return tagIgnoreFiltersSchema.parse({
    page: params.get('page') ?? 1,
    search: params.get('search') ?? '',
    ignore: params.get('ignore') ?? '',
  });
}

/** 기본값은 URL에 남기지 않아 주소를 짧게 유지한다. */
export function serializeTagIgnoreFilters(
  filters: TagIgnoreFilters,
  base?: URLSearchParams,
) {
  const params = new URLSearchParams(base);
  const entries: [string, string][] = [
    ['page', filters.page > 1 ? String(filters.page) : ''],
    ['search', filters.search],
    ['ignore', filters.ignore],
  ];
  for (const [key, value] of entries) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  return params;
}

/**
 * 목록의 NO.는 서버가 주지 않는다. 기존 콘솔처럼 전체 개수에서 거꾸로 센다.
 */
export function tagIgnoreRowNumber(
  totalCount: number,
  page: number,
  index: number,
) {
  return totalCount - (page - 1) * TAG_IGNORE_PAGE_SIZE - index;
}

/** 기존 콘솔과 같은 표 밀도를 노려 고른 값이다. 화면 높이에 맞춰 늘리던
 * 기존 콘솔의 반응형 계산(5~39건)은 표가 스크롤을 지원해 필요 없다. */
export const TAG_TOTAL_PAGE_SIZE = 30;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const sortSchema = z.enum(['asc', 'desc']);

const tagTotalFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().trim().max(100).catch(''),
  startDate: z.string().regex(DATE).catch(''),
  endDate: z.string().regex(DATE).catch(''),
  tagOrder: sortSchema.catch('asc'),
  /** 빈 문자열이면 집계순 정렬을 쓰지 않는다. 기존 콘솔에서 태그순 정렬을
   * 누르면 집계순 정렬을 끄던 동작과 같다. */
  sumOrder: z.union([sortSchema, z.literal('')]).catch('desc'),
});

export type TagTotalFilters = z.infer<typeof tagTotalFiltersSchema>;

/** 기존 콘솔의 기본 집계 구간(1년)과 같다. */
export function defaultTagTotalRange() {
  return { startDate: shiftDate(365), endDate: today() };
}

// URL에는 빈 문자열을 그대로 남길 수 없다(생략과 구분이 안 된다). '끔'을
// 사람이 읽을 수 있는 별도 토큰으로 둔다.
const SUM_ORDER_OFF = 'off';

/** URL은 사용자가 고칠 수 있는 외부 입력이다. 잘못된 값은 기본값으로 되돌린다. */
export function parseTagTotalFilters(params: URLSearchParams): TagTotalFilters {
  const defaults = defaultTagTotalRange();
  const sumOrderParam = params.get('sumOrder');
  return tagTotalFiltersSchema.parse({
    page: params.get('page') ?? 1,
    search: params.get('search') ?? '',
    startDate: params.get('start') ?? defaults.startDate,
    endDate: params.get('end') ?? defaults.endDate,
    tagOrder: params.get('tagOrder') ?? 'asc',
    sumOrder: sumOrderParam === SUM_ORDER_OFF ? '' : (sumOrderParam ?? 'desc'),
  });
}

export function serializeTagTotalFilters(
  filters: TagTotalFilters,
  base?: URLSearchParams,
) {
  const params = new URLSearchParams(base);
  const entries: [string, string][] = [
    ['page', filters.page > 1 ? String(filters.page) : ''],
    ['search', filters.search],
    ['start', filters.startDate],
    ['end', filters.endDate],
    ['tagOrder', filters.tagOrder === 'asc' ? '' : filters.tagOrder],
    [
      'sumOrder',
      filters.sumOrder === 'desc'
        ? ''
        : filters.sumOrder === ''
          ? SUM_ORDER_OFF
          : filters.sumOrder,
    ],
  ];
  for (const [key, value] of entries) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  return params;
}

export function countTagTotalPages(totalCount: number) {
  return Math.max(1, Math.ceil(totalCount / TAG_TOTAL_PAGE_SIZE));
}

/** 목록의 NO.는 서버가 주지 않는다. 기존 콘솔처럼 전체 개수에서 거꾸로 센다. */
export function tagTotalRowNumber(
  totalCount: number,
  page: number,
  index: number,
) {
  return totalCount - (page - 1) * TAG_TOTAL_PAGE_SIZE - index;
}
