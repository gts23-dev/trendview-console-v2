import { Crown } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '@/shared/utils/class-name';
import { formatCount } from '@/shared/utils/format';
import { useMediaScope } from '@/features/medias';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DateRangeField } from '@/components/common/date-range-field';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { useVisitorRanks } from '../hooks/use-visitors';
import {
  isMemberId,
  parseVisitorFilters,
  serializeVisitorFilters,
  type VisitorFilters,
} from '../model/visitors';

const SORT_OPTIONS: { value: VisitorFilters['sort']; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'member', label: '회원' },
  { value: 'none_member', label: '비회원' },
];

export function VisitorRankList() {
  const { mediaId } = useMediaScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseVisitorFilters(searchParams);
  const ranks = useVisitorRanks(mediaId, filters);

  function apply(next: Partial<VisitorFilters>) {
    setSearchParams((current) =>
      serializeVisitorFilters({ ...filters, ...next }, current),
    );
  }

  const items = ranks.data ?? [];

  return (
    <div className="space-y-5 px-5 py-6 sm:px-8 lg:px-10">
      <PageHeader
        title="접속자 순위"
        description="선택한 기간 동안 회원·비회원이 접속한 횟수를 집계한 순위입니다. 사용자 아이디를 누르면 사용자 검색으로 이동합니다."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.sort || 'all'}
          onValueChange={(value) =>
            apply({
              sort: value === 'all' ? '' : (value as VisitorFilters['sort']),
            })
          }
        >
          <SelectTrigger className="w-[140px]" aria-label="정렬 기준">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem
                key={option.value || 'all'}
                value={option.value || 'all'}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangeField
          startDate={filters.startDate}
          endDate={filters.endDate}
          onChange={(startDate, endDate) => apply({ startDate, endDate })}
        />
      </div>

      {ranks.isPending ? (
        <LoadingState />
      ) : ranks.isError ? (
        <ErrorState retry={() => ranks.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="해당 기간에는 데이터가 없습니다"
          description="기간이나 정렬 기준을 바꿔서 다시 시도해 주세요."
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24 text-center">순위</TableHead>
                <TableHead>사용자 아이디</TableHead>
                <TableHead className="w-32 text-right">접속 횟수</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.userId}>
                  <TableCell className="text-center tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      {item.rank === 1 && (
                        <Crown className="size-4 text-amber-500" />
                      )}
                      {item.rank}위
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/stats/user-search?search=${encodeURIComponent(item.userId)}&media=${mediaId}`}
                      className={cn(
                        'font-medium hover:underline',
                        isMemberId(item.userId)
                          ? 'text-indigo-700'
                          : 'text-muted-foreground',
                      )}
                    >
                      {item.userId}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCount(item.count)}회
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
