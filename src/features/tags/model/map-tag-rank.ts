import { formatTagRankDateLabel, type RankDateChoice } from './tag-ranks';

export interface TagRankSlot {
  tag: string;
  uvCount: number;
  pvCount: number;
}

export interface TagRankBucketInput {
  dateType: string;
  slots: TagRankSlot[];
}

export interface TagRankEntry extends TagRankSlot {
  rank: number;
}

export interface TagRankBucket {
  dateLabel: string;
  /** 태그 클릭 시 게시정보 대화상자에 보낼 원래 구간 값(표시용 라벨과 다르다). */
  dateType: string;
  items: TagRankEntry[];
  hasData: boolean;
}

/**
 * 콘텐츠 순위와 달리 이 화면의 순위 자리에는 빈 자리 개념이 없다 — 기존
 * 콘솔도 순번을 배열 순서 그대로(`Object.keys` 인덱스 + 1) 매긴다. 100위까지만
 * 화면에 보여준다.
 */
export function mapTagRankBucket(
  input: TagRankBucketInput,
  dateChoice: RankDateChoice,
): TagRankBucket {
  const items = input.slots.slice(0, 100).map((slot, index) => ({
    ...slot,
    rank: index + 1,
  }));
  return {
    dateLabel: formatTagRankDateLabel(input.dateType, dateChoice),
    dateType: input.dateType,
    items,
    hasData: input.slots.length > 0,
  };
}
