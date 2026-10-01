import type { PlatformCount } from './types';

/** 이 화면이 다루는 6개 플랫폼과 표시 순서. 기존 콘솔의 `platform_items`
 * 순서와 같다. */
export const PLATFORM_ORDER = [
  'instagram',
  'youtube',
  'naver-blog',
  'google-news',
  'twitter',
  'naver-news',
] as const;

/**
 * 서버가 준 플랫폼별 누적 개수를 고정 순서로 정렬하고, 응답에 없는 플랫폼은
 * 0으로 채운다. 기존 콘솔은 twitter가 빠졌을 때만 0으로 채웠는데, 여기서는
 * 6개 전부에 같은 규칙을 적용해 어떤 플랫폼이 빠져도 순서가 흔들리지 않는다.
 */
export function orderPlatformCounts(
  items: { platform: string; count: number }[],
): PlatformCount[] {
  const byPlatform = new Map(items.map((item) => [item.platform, item.count]));
  return PLATFORM_ORDER.map((platform) => ({
    platform,
    count: byPlatform.get(platform) ?? 0,
  }));
}
