import { z } from 'zod';
import { shiftDate, today } from '@/shared/utils/format';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const sortSchema = z.enum(['', 'member', 'none_member']);

const filtersSchema = z.object({
  startDate: z.string().regex(DATE).catch(''),
  endDate: z.string().regex(DATE).catch(''),
  sort: sortSchema.catch(''),
});

export type VisitorFilters = z.infer<typeof filtersSchema>;

export interface VisitorRank {
  rank: number;
  userId: string;
  count: number;
}

/** 기존 콘솔의 기본 조회 구간(최근 30일)과 같다. */
export function defaultVisitorRange() {
  return { startDate: shiftDate(30), endDate: today() };
}

/** URL은 사용자가 고칠 수 있는 외부 입력이다. 잘못된 값은 기본값으로 되돌린다. */
export function parseVisitorFilters(params: URLSearchParams): VisitorFilters {
  const defaults = defaultVisitorRange();
  return filtersSchema.parse({
    startDate: params.get('start') ?? defaults.startDate,
    endDate: params.get('end') ?? defaults.endDate,
    sort: params.get('sort') ?? '',
  });
}

/** 기본 정렬('전체')은 URL에 남기지 않아 주소를 짧게 유지한다. */
export function serializeVisitorFilters(
  filters: VisitorFilters,
  base?: URLSearchParams,
) {
  const params = new URLSearchParams(base);
  const entries: [string, string][] = [
    ['start', filters.startDate],
    ['end', filters.endDate],
    ['sort', filters.sort],
  ];
  for (const [key, value] of entries) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  return params;
}

/** 회원 아이디는 36자리 UUID다. 기존 콘솔의 색 구분 기준과 같다. */
export function isMemberId(userId: string) {
  return userId.length === 36;
}
