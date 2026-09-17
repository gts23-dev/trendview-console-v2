export interface Topic {
  id: number;
  mediaId: number;
  topic: string;
  createdAt: string;
}

export interface TopicListResult {
  items: Topic[];
  totalCount: number;
}
