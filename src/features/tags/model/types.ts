export interface TagIgnore {
  id: number;
  mediaId: number;
  mediaName: string;
  tag: string;
  /** 제외 적용 여부. 켜면 통계와 노출에서 이 태그를 뺀다. */
  ignore: boolean;
}

export interface TagIgnoreListResult {
  items: TagIgnore[];
  totalCount: number;
}
