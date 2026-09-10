import type { Entry } from './types';

export const STATUS_LABELS = {
  published: '게시 중',
  draft: '임시 저장',
  archived: '보관',
} satisfies Record<Entry['status'], string>;
