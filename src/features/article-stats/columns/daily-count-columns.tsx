import type { ColumnDef } from '@tanstack/react-table';
import { formatCount } from '@/shared/utils/format';
import { getPlatformLabel } from '@/features/articles';
import { PLATFORM_ORDER } from '../model/platforms';
import type { DailyPlatformCount } from '../model/types';

export function createDailyCountColumns(): ColumnDef<DailyPlatformCount>[] {
  return [
    {
      accessorKey: 'date',
      header: '수집일',
      size: 90,
      // 서버는 전체 날짜를 주지만 기존 콘솔처럼 월-일만 보여준다.
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.date.slice(5)}</span>
      ),
    },
    ...PLATFORM_ORDER.map((platform): ColumnDef<DailyPlatformCount> => ({
      id: platform,
      header: getPlatformLabel(platform),
      meta: {
        headerClassName: 'text-right',
        cellClassName: 'text-right tabular-nums',
      },
      cell: ({ row }) => `${formatCount(row.original.counts[platform] ?? 0)}개`,
    })),
    {
      id: 'total',
      header: '합계',
      meta: {
        headerClassName: 'text-right',
        cellClassName: 'text-right font-medium tabular-nums',
      },
      cell: ({ row }) => `${formatCount(row.original.total)}개`,
    },
  ];
}
