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

export interface TagTotal {
  mediaName: string;
  tag: string;
  /** 수집수. 서버가 null을 줄 수 있어 매퍼가 0으로 채운다. */
  count: number;
}

export interface TagTotalListResult {
  items: TagTotal[];
  totalCount: number;
}
