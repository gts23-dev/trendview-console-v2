import type { ColumnDef } from '@tanstack/react-table';
import { formatCount } from '@/shared/utils/format';
import type { UvPvPoint } from '../model/uv-pv';

const numericMeta = {
  headerClassName: 'text-right',
  cellClassName: 'text-right tabular-nums',
} as const;

export function createUvPvColumns(): ColumnDef<UvPvPoint>[] {
  return [
    { accessorKey: 'dateLabel', header: 'date.', size: 100 },
    {
      id: 'uvCount',
      header: 'UV (방문)',
      meta: numericMeta,
      cell: ({ row }) => `${formatCount(row.original.uvCount)}명`,
    },
    {
      id: 'pvCount',
      header: 'PV (방문)',
      meta: numericMeta,
      cell: ({ row }) => `${formatCount(row.original.pvCount)}번`,
    },
    {
      id: 'uvClickCount',
      header: 'UV (클릭)',
      meta: numericMeta,
      cell: ({ row }) => `${formatCount(row.original.uvClickCount)}번`,
    },
    {
      id: 'articleCount',
      header: 'PV (클릭)',
      meta: numericMeta,
      cell: ({ row }) => `${formatCount(row.original.articleCount)}번`,
    },
  ];
}
