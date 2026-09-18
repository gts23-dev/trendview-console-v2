/**
 * 일/주/월 단위로 기간을 묶어 보여주는 통계 화면들이 공유하는 선택지다.
 * '기간(custom)'까지 있는 화면(수집/게시/신고 개수)은 이 목록 대신 자기
 * 화면 안에 4개짜리 목록을 따로 둔다.
 */
export const PERIOD_CHOICES = ['daily', 'weekly', 'monthly'] as const;
export type PeriodChoice = (typeof PERIOD_CHOICES)[number];
