import type { ColumnDef } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import { formatCount } from '@/shared/utils/format';
import { Button } from '@/components/ui/button';
import { topicRowNumber } from '../model/filters';
import type { Topic } from '../model/types';

export function createTopicColumns(
  totalCount: number,
  page: number,
  onEdit: (topic: Topic) => void,
): ColumnDef<Topic>[] {
  return [
    {
      id: 'no',
      header: 'NO.',
      meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
      size: 90,
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {formatCount(topicRowNumber(totalCount, page, row.index))}
        </span>
      ),
    },
    {
      accessorKey: 'topic',
      header: '카테고리',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.topic}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: '등록일',
      meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
      size: 200,
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {row.original.createdAt || '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '수정',
      size: 80,
      meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${row.original.topic} 수정`}
          onClick={() => onEdit(row.original)}
        >
          <Pencil className="size-4" />
        </Button>
      ),
    },
  ];
}
