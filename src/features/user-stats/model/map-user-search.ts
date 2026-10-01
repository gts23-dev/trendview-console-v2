/**
 * 기존 콘솔은 서버가 보낸 순서를 그대로 쓰고 빠진 항목만 고정된 순서로
 * 뒤에 덧붙였다(응답 순서에 따라 카드 배열이 흔들림). 여기서는 항상 이
 * 고정 순서로 보여준다 — 어떤 이벤트가 오든 카드 위치가 흔들리지 않는
 * 화면이 더 낫다고 판단했다.
 */
export const EVENT_ORDER = ['visit', 'click', 'like', 'favorite'] as const;

/** 기존 콘솔의 platform_items 기본 템플릿과 같은 순서. */
export const PLATFORM_ORDER = [
  'instagram',
  'naver-blog',
  'google-news',
  'youtube',
  'twitter',
] as const;

export interface UserSearchEventCount {
  event: string;
  count: number;
}

export interface UserSearchPlatformCount {
  platform: string;
  count: number;
}

export interface UserSearchArticleEntry {
  articleId: number;
  count: number;
  articleData: {
    platform: string;
    title?: string | null;
    contents?: string | null;
  } | null;
}

export interface UserSearchArticleRank {
  rank: number;
  articleId: number;
  count: number;
  /** article_data가 없으면(콘텐츠가 지워졌을 때) 플랫폼을 알 수 없다. */
  platform: string | null;
  /** 제목이 없으면 본문을, 그것도 없으면 글번호를 보여준다(기존 콘솔과 동일). */
  text: string;
}

export interface UserSearchTagEntry {
  tag: string;
  count: number;
}

export interface UserSearchTagRank {
  rank: number;
  tag: string;
  count: number;
}

function fillTemplate<TKey extends string>(
  order: readonly TKey[],
  counts: { key: string; count: number }[],
) {
  const byKey = new Map(counts.map((item) => [item.key, item.count]));
  return order.map((key) => ({ key, count: byKey.get(key) ?? 0 }));
}

export function mapUserSearchEvents(
  counts: { key: string; count: number }[],
): UserSearchEventCount[] {
  return fillTemplate(EVENT_ORDER, counts).map(({ key, count }) => ({
    event: key,
    count,
  }));
}

export function mapUserSearchPlatforms(
  counts: { key: string; count: number }[],
): UserSearchPlatformCount[] {
  return fillTemplate(PLATFORM_ORDER, counts).map(({ key, count }) => ({
    platform: key,
    count,
  }));
}

/** 100위까지만 보여준다(다른 순위 화면과 같은 상한, 화면 설명 문구와 일치). */
export function mapUserSearchArticles(
  entries: UserSearchArticleEntry[],
): UserSearchArticleRank[] {
  return entries.slice(0, 100).map((entry, index) => ({
    rank: index + 1,
    articleId: entry.articleId,
    count: entry.count,
    platform: entry.articleData?.platform ?? null,
    text: entry.articleData
      ? (entry.articleData.title || entry.articleData.contents || '').slice(
          0,
          60,
        )
      : String(entry.articleId),
  }));
}

export function mapUserSearchTags(
  entries: UserSearchTagEntry[],
): UserSearchTagRank[] {
  return entries.slice(0, 100).map((entry, index) => ({
    rank: index + 1,
    tag: entry.tag,
    count: entry.count,
  }));
}
