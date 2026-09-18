import { toOrderedList } from '@/shared/utils/ordered-list';
import { formatBucketLabel, type RankDateChoice } from './content-ranks';
import type { ContentRankBucket } from './types';

// 다른 통계 화면(사용자별 PV 등)도 같은 정규화가 필요해서 shared로 옮겼다.
// 공개 진입점은 그대로 이 이름으로 내보낸다.
export { toOrderedList as normalizeRankSlots };

export interface ContentRankArticleRef {
  id: number;
  platform: string;
  title?: string | null;
  contents?: string | null;
}

export interface ContentRankSlot {
  article: ContentRankArticleRef | null;
  /**
   * 표시에는 쓰지 않지만 순위 계산에는 들어간다. article과 posted_article이
   * 둘 다 null인 자리만 순위 없이 건너뛴다. 실제 응답에서 이 필드가 언제
   * 채워지는지는 확인되지 않았고, 기존 콘솔의 null 판정 조건만 그대로
   * 옮겼다.
   */
  postedArticle: unknown;
  uvCount: number;
  pvCount: number;
}

export interface ContentRankBucketInput {
  dateType: string;
  slots: ContentRankSlot[];
}

/**
 * 순위 자리(articles 배열의 각 항목)를 앞에서부터 훑으며, article과
 * posted_article이 둘 다 없는 자리만 건너뛰고 순번을 매긴다. 화면에는
 * article이 있는 자리(최대 100위)만 보여준다 — article 없이 posted_article만
 * 있는 자리는 순번 계산에는 들어가지만 목록에는 나타나지 않는다. 기존
 * 콘솔의 동작을 그대로 옮겼다.
 */
export function mapContentRankBucket(
  input: ContentRankBucketInput,
  dateChoice: RankDateChoice,
): ContentRankBucket {
  let nullCount = 0;
  const items: ContentRankBucket['items'] = [];

  input.slots.forEach((slot, index) => {
    const isEmpty = slot.article === null && slot.postedArticle === null;
    if (isEmpty) {
      nullCount += 1;
      return;
    }
    const rank = index + 1 - nullCount;
    if (slot.article !== null && rank < 101) {
      items.push({
        rank,
        articleId: slot.article.id,
        platform: slot.article.platform,
        title: slot.article.title || slot.article.contents || '',
        uvCount: slot.uvCount,
        pvCount: slot.pvCount,
      });
    }
  });

  return {
    dateLabel: formatBucketLabel(input.dateType, dateChoice),
    items,
    hasData: nullCount !== input.slots.length,
  };
}
