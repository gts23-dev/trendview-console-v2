export interface ArticleCounts {
  /** 수집 누적 수 */
  inactive: number;
  /** 게시 누적 수 */
  active: number;
  /** 신고 누적 수 */
  report: number;
  /** 삭제 누적 수 */
  reportBlock: number;
  todayActive: number;
  yesterdayActive: number;
  todayInactive: number;
  yesterdayInactive: number;
}

export interface PlatformCount {
  platform: string;
  count: number;
}

export interface DailyPlatformCount {
  /** 'YYYY-MM-DD'. 표시는 화면에서 월-일만 잘라 쓴다. */
  date: string;
  counts: Record<string, number>;
  total: number;
}

export interface ContentRankItem {
  rank: number;
  articleId: number;
  platform: string;
  title: string;
  uvCount: number;
  pvCount: number;
}

export interface ContentRankBucket {
  /** '2026-09-10(수)'처럼 이미 표시용으로 다듬은 라벨. */
  dateLabel: string;
  items: ContentRankItem[];
  /** 구간 안의 모든 순위 자리가 비어 있으면(둘 다 null) false다. */
  hasData: boolean;
}

export interface ContentRankResult {
  buckets: ContentRankBucket[];
  totalCount: number;
}
