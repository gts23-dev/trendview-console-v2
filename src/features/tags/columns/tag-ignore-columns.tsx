import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { formatCount } from '@/shared/utils/format';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { tagIgnoreRowNumber } from '../model/filters';
import type { TagIgnore } from '../model/types';

interface Options {
  totalCount: number;
  page: number;
  onToggle: (tag: TagIgnore) => void;
  onDelete: (tag: TagIgnore) => void;
  pendingId: number | null;
}

export function createTagIgnoreColumns({
  totalCount,
  page,
  onToggle,
  onDelete,
  pendingId,
}: Options): ColumnDef<TagIgnore>[] {
  return [
    {
      id: 'no',
      header: 'NO.',
      meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
      size: 90,
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {formatCount(tagIgnoreRowNumber(totalCount, page, row.index))}
        </span>
      ),
    },
    {
      accessorKey: 'mediaName',
      header: '매체',
      size: 140,
      meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
    },
    {
      accessorKey: 'tag',
      header: '태그',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.tag}</span>
      ),
    },
    {
      id: 'ignore',
      header: '적용여부',
      meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
      size: 110,
      cell: ({ row }) => (
        <Switch
          checked={row.original.ignore}
          disabled={pendingId === row.original.id}
          aria-label={`${row.original.tag} 제외 적용`}
          onCheckedChange={() => onToggle(row.original)}
        />
      ),
    },
    {
      id: 'actions',
      header: '삭제',
      size: 80,
      meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${row.original.tag} 삭제`}
          onClick={() => onDelete(row.original)}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      ),
    },
  ];
}
