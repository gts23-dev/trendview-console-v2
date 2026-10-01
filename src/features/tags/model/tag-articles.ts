import { joinUrl } from '@/shared/utils/url';

export interface TagArticleRaw {
  id: number;
  platform: string;
  title?: string | null;
  contents?: string | null;
  business_tag?: string | null;
  storage_thumbnail_url?: string | null;
  thumbnail_url?: string | null;
  date?: string | null;
  article_medias?: { storage_url?: string | null }[] | null;
}

export interface TagArticleItem {
  id: number;
  platform: string;
  title: string;
  contents: string;
  businessTag: string;
  imageUrl: string;
  originImageUrl: string;
  date: string;
}

export interface TagArticleListResult {
  items: TagArticleItem[];
  totalCount: number;
}

export const TAG_ARTICLE_PAGE_SIZE = 6;

/**
 * 대표 썸네일이 없으면 함께 수집한 첨부 이미지를 쓴다(게시정보 목록의
 * `mapArticle`과 같은 순서). 이 화면은 단순 미리보기라 인스타그램 다중
 * 이미지 같은 별도 처리는 두지 않는다.
 */
export function mapTagArticle(
  data: TagArticleRaw,
  storageBaseUrl: string,
): TagArticleItem {
  const storageImage =
    joinUrl(storageBaseUrl, data.storage_thumbnail_url ?? '') ||
    joinUrl(storageBaseUrl, data.article_medias?.[0]?.storage_url ?? '');
  return {
    id: data.id,
    platform: data.platform,
    title: data.title ?? '',
    contents: data.contents || '내용 없음',
    businessTag: data.business_tag ? `#${data.business_tag}` : '#태그없음',
    imageUrl: storageImage || (data.thumbnail_url ?? ''),
    originImageUrl: data.thumbnail_url ?? '',
    date: (data.date ?? '').slice(0, 10),
  };
}
