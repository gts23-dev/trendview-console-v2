import { joinUrl } from '@/shared/utils/url';
import type { ArticleFilters } from './filters';
import type { ArticleListItem } from './types';

/** API 응답에서 목록 화면이 사용하는 필드만 추린 형태. */
export interface ArticleData {
  id: number;
  platform: string;
  type?: string | null;
  keyword?: string | null;
  channel?: string | null;
  topic?: string | null;
  title?: string | null;
  contents?: string | null;
  url?: string | null;
  storage_thumbnail_url?: string | null;
  thumbnail_url?: string | null;
  thumbnail_width?: number | null;
  thumbnail_height?: number | null;
  business_tag?: string | null;
  state?: number | null;
  view_count?: number | null;
  date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  article_owner?: { name?: string | null } | null;
  hashtag?: string | null;
  article_medias?:
    | {
        type?: string | null;
        url?: string | null;
        storage_url?: string | null;
        width?: number | null;
        height?: number | null;
      }[]
    | null;
}

function toDate(value: string | null | undefined) {
  return value ? value.slice(0, 10) : '';
}

/**
 * 정렬 기준에 따라 카드에 앞세우는 날짜가 바뀐다. `date`는 원문 작성일이고
 * `created_at`은 수집일이다.
 */
export function mapArticle(
  data: ArticleData,
  storageBaseUrl: string,
  sort: ArticleFilters['sort'],
): ArticleListItem {
  const byCollectedAt = sort === 'sort_id';
  // 기존 콘솔과 같은 순서다. 대표 썸네일이 없으면 함께 수집한 첨부 이미지를
  // 쓴다. 둘 다 없을 때만 플랫폼 원본으로 내려가는데, 네이버처럼 외부 참조를
  // 막는 곳이 있어 마지막 수단이다.
  const storageImage =
    joinUrl(storageBaseUrl, data.storage_thumbnail_url ?? '') ||
    joinUrl(storageBaseUrl, data.article_medias?.[0]?.storage_url ?? '');
  return {
    id: data.id,
    platform: data.platform,
    type: data.type ?? '',
    // 채널 수집은 채널 id 대신 응답에 함께 오는 채널명을 보여준다.
    source: data.keyword ?? data.article_owner?.name ?? data.channel ?? '',
    topic: data.topic ?? '',
    title: data.title ?? '',
    contents: data.contents ?? '',
    url: data.url ?? '',
    imageUrl: storageImage || (data.thumbnail_url ?? ''),
    originImageUrl: data.thumbnail_url ?? '',
    imageWidth: data.thumbnail_width ?? 0,
    imageHeight: data.thumbnail_height ?? 0,
    primaryDate: toDate(byCollectedAt ? data.created_at : data.date),
    primaryDateLabel: byCollectedAt ? '수집일' : '작성일',
    secondaryDate: toDate(byCollectedAt ? data.date : data.created_at),
    secondaryDateLabel: byCollectedAt ? '작성일' : '수집일',
    businessTag: data.business_tag ? `#${data.business_tag}` : '',
    state: data.state ?? 0,
    viewCount: data.view_count ?? 0,
    writtenDate: toDate(data.date),
    collectedDate: toDate(data.created_at),
    postedDate: toDate(data.updated_at),
    // 기존 콘솔처럼 공백으로 잘라 태그 목록을 만든다. 빈 조각은 버린다.
    hashtags: (data.hashtag ?? '').split(' ').filter(Boolean),
    // 첨부에는 id가 없어서 순서를 열쇠로 쓴다.
    medias: (data.article_medias ?? []).map((media, index) => ({
      id: index,
      type: media.type ?? '',
      url: media.url ?? '',
      imageUrl: joinUrl(storageBaseUrl, media.storage_url ?? ''),
      width: media.width ?? 0,
      height: media.height ?? 0,
    })),
  };
}
