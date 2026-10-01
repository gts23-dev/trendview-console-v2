import type { ColumnDef } from '@tanstack/react-table';
import { formatCount } from '@/shared/utils/format';
import { HighlightedText } from '../components/highlighted-text';
import { SortHeader } from '../components/sort-header';
import { tagTotalRowNumber, type TagTotalFilters } from '../model/filters';
import type { TagTotal } from '../model/types';

interface SortState {
  tagOrder: TagTotalFilters['tagOrder'];
  sumOrder: TagTotalFilters['sumOrder'];
}

interface SortActions {
  onToggleTagOrder: () => void;
  onToggleSumOrder: () => void;
}

export function createTagTotalColumns(
  totalCount: number,
  page: number,
  search: string,
  sort: SortState,
  actions: SortActions,
): ColumnDef<TagTotal>[] {
  return [
    {
      id: 'no',
      header: 'NO.',
      size: 80,
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {formatCount(tagTotalRowNumber(totalCount, page, row.index))}
        </span>
      ),
    },
    {
      accessorKey: 'mediaName',
      header: '매체',
      size: 140,
    },
    {
      id: 'tag',
      header: () => (
        <SortHeader
          label="태그"
          active={sort.tagOrder === 'asc'}
          onToggle={actions.onToggleTagOrder}
        />
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          <HighlightedText text={row.original.tag} query={search} />
        </span>
      ),
    },
    {
      id: 'count',
      header: () => (
        <SortHeader
          label="수집수"
          active={sort.sumOrder === 'asc'}
          onToggle={actions.onToggleSumOrder}
        />
      ),
      size: 140,
      meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatCount(row.original.count)}개
        </span>
      ),
    },
  ];
}
