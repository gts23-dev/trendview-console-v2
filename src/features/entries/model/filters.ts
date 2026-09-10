import type { Entry } from './types';

export interface EntryFilters {
  page: number;
  status: 'all' | Entry['status'];
  search: string;
  sort: 'newest' | 'oldest' | 'title';
}
