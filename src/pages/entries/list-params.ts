import type { EntryFilters } from '@/features/entries';

export function readListParams(params: URLSearchParams): EntryFilters {
  const page = Number(params.get('page') || 1);
  const status = params.get('status');
  const sort = params.get('sort');
  return {
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    status:
      status === 'published' || status === 'draft' || status === 'archived'
        ? status
        : 'all',
    search: params.get('search') || '',
    sort: sort === 'oldest' || sort === 'title' ? sort : 'newest',
  };
}
