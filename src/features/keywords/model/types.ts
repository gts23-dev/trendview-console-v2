export interface BaseKeyword {
  id: number;
  mediaId: number;
  keyword: string;
  topic: string;
  /** 요청에 담기는 영문 플랫폼 이름. */
  platforms: string[];
  /** 사용여부. 끄면 이 키워드로 수집하지 않는다. */
  active: boolean;
  createdAt: string;
}

export interface BaseKeywordListResult {
  items: BaseKeyword[];
  totalCount: number;
}
