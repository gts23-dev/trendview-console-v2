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
