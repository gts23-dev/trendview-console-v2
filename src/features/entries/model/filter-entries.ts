import type { EntryFilters } from './filters';
import type { Entry } from './types';

export function filterEntries(entries: Entry[], params: EntryFilters): Entry[] {
  const search = params.search.trim().toLocaleLowerCase();
  return entries
    .filter(
      (item) =>
        (params.status === 'all' || item.status === params.status) &&
        `${item.title} ${item.id} ${item.author}`
          .toLocaleLowerCase()
          .includes(search),
    )
    .sort((a, b) =>
      params.sort === 'title'
        ? a.title.localeCompare(b.title, 'ko')
        : params.sort === 'oldest'
          ? Date.parse(a.updatedAt) - Date.parse(b.updatedAt)
          : Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
    );
}
