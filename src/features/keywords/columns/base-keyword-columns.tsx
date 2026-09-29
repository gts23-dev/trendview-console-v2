import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { formatCount } from '@/shared/utils/format';
import {
  getPlatformBadge,
  getPlatformLabel,
  PlatformMark,
  sortPlatforms,
} from '@/features/articles';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { baseKeywordRowNumber } from '../model/filters';
import type { BaseKeyword } from '../model/types';

interface Options {
  totalCount: number;
  page: number;
  /** 매체 id에 대응하는 이름. 응답에 이름이 없어 세션의 매체 목록에서 찾는다. */
  mediaNames: Record<number, string>;
  onEdit: (keyword: BaseKeyword) => void;
  onDelete: (keyword: BaseKeyword) => void;
  onToggle: (keyword: BaseKeyword) => void;
  /** 토글 요청이 도는 행. 연타로 같은 행에 요청이 겹치지 않게 막는다. */
  pendingId: number | null;
}

// 노출여부 열은 기존 콘솔에서도 주석 처리된 상태였다(BaseKeyword.vue:158).
// 되살릴 때는 toggle-exposable API와 함께 열을 하나 더 추가한다.
export function createBaseKeywordColumns({
  totalCount,
  page,
  mediaNames,
  onEdit,
  onDelete,
  onToggle,
  pendingId,
}: Options): ColumnDef<BaseKeyword>[] {
  return [
    {
      id: 'no',
      header: 'NO.',
      meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
      size: 80,
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {formatCount(baseKeywordRowNumber(totalCount, page, row.index))}
        </span>
      ),
    },
    {
      id: 'media',
      header: '매체',
      size: 120,
      meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
      cell: ({ row }) => mediaNames[row.original.mediaId] ?? '-',
    },
    {
      accessorKey: 'keyword',
      header: '키워드(PK)',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.keyword}</span>
      ),
    },
    {
      id: 'platforms',
      header: '플랫폼',
      meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
      size: 160,
      cell: ({ row }) => (
        <span className="flex items-center justify-center gap-1">
          {sortPlatforms(row.original.platforms).map((platform) => (
            <span
              key={platform}
              title={getPlatformLabel(platform)}
              className="flex size-7 items-center justify-center rounded-full border border-gray-300"
            >
              <PlatformMark
                plain
                mark={getPlatformBadge(platform).mark}
                className="size-5"
              />
            </span>
          ))}
        </span>
      ),
    },
    {
      accessorKey: 'topic',
      header: '카테고리',
      size: 140,
      meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
    },
    {
      id: 'active',
      header: '사용여부',
      meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
      size: 100,
      cell: ({ row }) => (
        <Switch
          checked={row.original.active}
          disabled={pendingId === row.original.id}
          aria-label={`${row.original.keyword} 사용`}
          onCheckedChange={() => onToggle(row.original)}
        />
      ),
    },
    {
      accessorKey: 'createdAt',
      header: '생성일',
      meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
      size: 180,
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {row.original.createdAt || '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '수정/삭제',
      size: 110,
      meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
      cell: ({ row }) => (
        <span className="inline-flex gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${row.original.keyword} 수정`}
            onClick={() => onEdit(row.original)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${row.original.keyword} 삭제`}
            onClick={() => onDelete(row.original)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </span>
      ),
    },
  ];
}
