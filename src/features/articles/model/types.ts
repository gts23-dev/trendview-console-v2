/** 목록·상세가 함께 쓰는 첨부 이미지. */
export interface ArticleMedia {
  id: number;
  type: string;
  url: string;
  /** 스토리지에 올라간 이미지. 없으면 빈 문자열 */
  imageUrl: string;
  width: number;
  height: number;
}

/** 신고 1건. 신고자 정보가 포함된 개인정보다. */
export interface ArticleReport {
  id: number;
  userId: string;
  userName: string;
  type: string;
  description: string;
  date: string;
}

/** 목록 화면이 사용하는 형태로 변환한 콘텐츠. */
export interface ArticleListItem {
  id: number;
  platform: string;
  /** 'keyword' 또는 'channel' */
  type: string;
  /** 수집 근거. 키워드 수집이면 키워드, 채널 수집이면 채널명 */
  source: string;
  topic: string;
  title: string;
  contents: string;
  url: string;
  /** 카드에 표시할 이미지. 스토리지 이미지가 없으면 플랫폼 원본 */
  imageUrl: string;
  /** 플랫폼 원본 이미지. 스토리지 이미지가 404일 때 대신 쓴다. */
  originImageUrl: string;
  imageWidth: number;
  imageHeight: number;
  /** 정렬 기준에 해당하는 날짜와 라벨 */
  primaryDate: string;
  primaryDateLabel: string;
  /** 다른 쪽 날짜 */
  secondaryDate: string;
  secondaryDateLabel: string;
  businessTag: string;
  /** 0: 수집, 1: 게시 */
  state: number;
  viewCount: number;
  /** 원문 작성일·수집일·게시일. 시트는 정렬과 무관하게 모두 보여준다. */
  writtenDate: string;
  collectedDate: string;
  /** 기존 콘솔이 "게시날짜"로 보여주던 `updated_at` */
  postedDate: string;
  hashtags: string[];
  /** 함께 수집한 이미지들. 인스타그램처럼 여러 장인 경우가 있다. */
  medias: ArticleMedia[];
}

export interface ArticleListResult {
  items: ArticleListItem[];
  /** 매체의 전체 개수 */
  totalCount: number;
  /** 현재 조회 조건에 해당하는 개수 */
  searchCount: number;
}
