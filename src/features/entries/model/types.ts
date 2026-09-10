export interface EntryInput {
  title: string;
  category: '공지' | '가이드' | '업데이트';
  status: 'published' | 'draft' | 'archived';
  description: string;
}

export interface Entry extends EntryInput {
  id: string;
  author: string;
  updatedAt: string;
}
