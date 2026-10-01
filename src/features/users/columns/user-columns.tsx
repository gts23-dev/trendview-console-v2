import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import type { User } from '../model/types';

export const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: '이름',
    size: 140,
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name || '-'}</span>
    ),
  },
  {
    accessorKey: 'email',
    header: '이메일',
    size: 240,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.email || '-'}</span>
    ),
  },
  {
    id: 'medias',
    header: '매체',
    // 매체가 많은 계정은 배지가 여러 줄이 된다. 가장 넓게 둔다.
    size: 520,
    cell: ({ row }) => (
      <span className="flex flex-wrap gap-1">
        {row.original.medias.map((media) => (
          <Badge key={media.id} variant="outline">
            {media.name}
          </Badge>
        ))}
      </span>
    ),
  },
];
