import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpRight, FileText } from 'lucide-react';
import { EntryStatusBadge } from '../components/entry-status-badge';
import type { Entry } from '../model/types';

export function createEntryColumns(
  open: (entry: Entry, target: HTMLElement) => void,
): ColumnDef<Entry>[] {
  return [
    {
      accessorKey: 'title',
      header: '콘텐츠',
      cell: ({ row }) => (
        <button
          className="group flex items-center gap-3 text-left"
          onClick={(event) => open(row.original, event.currentTarget)}
        >
          <span className="hidden size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/60 sm:flex">
            <FileText className="size-4 text-muted-foreground" />
          </span>
          <span>
            <span className="block max-w-[300px] truncate font-medium group-hover:text-primary">
              {row.original.title}
            </span>
            <span className="mt-1 block text-[11px] text-muted-foreground">
              {row.original.id}
            </span>
          </span>
        </button>
      ),
    },
    { accessorKey: 'category', header: '카테고리' },
    {
      accessorKey: 'status',
      header: '상태',
      cell: ({ row }) => <EntryStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'author',
      header: '작성자',
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-full bg-secondary text-[10px]">
            {String(getValue()).slice(0, 1)}
          </span>
          {String(getValue())}
        </span>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: '수정일',
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {new Date(String(getValue())).toLocaleDateString('ko-KR')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          className="grid size-9 place-items-center rounded hover:bg-muted"
          aria-label={`${row.original.title} 상세 보기`}
          onClick={(event) => open(row.original, event.currentTarget)}
        >
          <ArrowUpRight className="size-4 text-muted-foreground" />
        </button>
      ),
    },
  ];
}
