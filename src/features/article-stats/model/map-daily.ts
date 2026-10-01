import type { DailyPlatformCount } from './types';

/** 일간 개수 응답 한 행. 서버 필드명은 그대로(카멜케이스, 일부는 합성어)다. */
export interface DailyPlatformResponseItem {
  date: string;
  instagram: number;
  youtube: number;
  naverBlog: number;
  twitter: number;
  googleNews: number;
  naverNews: number;
}

export function mapDailyPlatformCount(
  item: DailyPlatformResponseItem,
): DailyPlatformCount {
  const counts: Record<string, number> = {
    instagram: item.instagram,
    youtube: item.youtube,
    'naver-blog': item.naverBlog,
    'google-news': item.googleNews,
    twitter: item.twitter,
    'naver-news': item.naverNews,
  };
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return { date: item.date, counts, total };
}
