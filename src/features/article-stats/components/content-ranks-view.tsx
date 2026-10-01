import { useState } from 'react';
import { Crown } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatCount } from '@/shared/utils/format';
import { getPlatformLabel } from '@/features/articles';
import { useMediaScope } from '@/features/medias';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChunkPagination } from '@/components/common/chunk-pagination';
import { DateRangeField } from '@/components/common/date-range-field';
import { ErrorState, LoadingState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { useChunkPager } from '@/components/common/use-chunk-pager';
import { useContentRanks } from '../hooks/use-content-ranks';
import {
  defaultRangeForRankChoice,
  parseContentRankFilters,
  RANK_DATE_CHOICES,
  serializeContentRankFilters,
  type ContentRankFilters,
  type ContentRankSort,
  type RankDateChoice,
} from '../model/content-ranks';

const SORT_OPTIONS: { value: ContentRankSort; label: string }[] = [
  { value: 'pv', label: 'PV 많은 순' },
  { value: 'uv', label: 'UV 많은 순' },
];

const DATE_CHOICE_LABELS: Record<RankDateChoice, string> = {
  daily: '일간',
  weekly: '주간',
  monthly: '월간',
};

const RANK_UNIT_LABELS: Record<RankDateChoice, string> = {
  daily: '일',
  weekly: '주',
  monthly: '월',
};

const BUCKETS_PER_PAGE = 2;

export function ContentRanksView() {
  const { mediaId } = useMediaScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseContentRankFilters(searchParams);
  const [page, setPage] = useState(1);
  const ranks = useContentRanks(mediaId, filters);

  function apply(next: Partial<ContentRankFilters>) {
    setSearchParams((current) =>
      serializeContentRankFilters({ ...filters, ...next }, current),
    );
    setPage(1);
  }

  function changeDateChoice(dateChoice: RankDateChoice) {
    // 구간 선택을 바꾸면 그 구간의 기본 기간으로 되돌아간다(기존 콘솔과 동일).
    apply({ dateChoice, ...defaultRangeForRankChoice(dateChoice) });
  }

  const buckets = ranks.data?.buckets ?? [];
  const pager = useChunkPager(buckets, {
    page,
    pageSize: BUCKETS_PER_PAGE,
    onPageChange: setPage,
  });

  return (
    <div className="space-y-5 px-5 py-6 sm:px-8 lg:px-10">
      <PageHeader
        title="콘텐츠 순위"
        description="순위는 100위까지 보여주며, 회원·비회원이 유입된 콘텐츠를 집계하여 보여줍니다. 인스타그램은 내용이, 그 외 플랫폼은 제목이 나옵니다."
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Select
          value={filters.sort}
          onValueChange={(value) => apply({ sort: value as ContentRankSort })}
        >
          <SelectTrigger className="w-[140px]" aria-label="정렬 기준">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tabs
          value={filters.dateChoice}
          onValueChange={(value) => changeDateChoice(value as RankDateChoice)}
        >
          <TabsList variant="button">
            {RANK_DATE_CHOICES.map((choice) => (
              <TabsTrigger key={choice} value={choice}>
                {DATE_CHOICE_LABELS[choice]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <DateRangeField
          startDate={filters.startDate}
          endDate={filters.endDate}
          onChange={(startDate, endDate) => apply({ startDate, endDate })}
        />
      </div>

      {ranks.isError ? (
        <ErrorState retry={() => ranks.refetch()} />
      ) : ranks.isPending ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {pager.pageItems.map((bucket, i) => (
              <div key={pager.pageStartIndex + i} className="rounded-lg border">
                <div className="border-b px-4 py-3 font-semibold">
                  {bucket.dateLabel}
                </div>
                <div className="flex border-b bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground">
                  <span className="w-[15%] text-center">순위</span>
                  <span className="w-[15%] text-center">플랫폼</span>
                  <span className="w-[50%] text-center">콘텐츠</span>
                  <span className="w-[10%] text-center">UV</span>
                  <span className="w-[10%] text-center">PV</span>
                </div>
                {bucket.hasData ? (
                  <ul className="max-h-[26rem] overflow-y-auto">
                    {bucket.items.map((item) => (
                      <li key={item.rank} className="border-b last:border-0">
                        <Link
                          to={`/articles?search=${item.articleId}&media=${mediaId}`}
                          className="flex items-center px-4 py-2.5 text-sm hover:bg-muted/40"
                        >
                          <span className="flex w-[15%] items-center justify-center gap-1 tabular-nums">
                            {item.rank === 1 && (
                              <Crown className="size-4 text-amber-500" />
                            )}
                            {item.rank}위
                          </span>
                          <span className="w-[15%] text-center text-xs text-muted-foreground">
                            {getPlatformLabel(item.platform)}
                          </span>
                          <span className="w-[50%] truncate px-2">
                            {item.title.slice(0, 50)}
                          </span>
                          <span className="w-[10%] text-center tabular-nums">
                            {formatCount(item.uvCount)}번
                          </span>
                          <span className="w-[10%] text-center tabular-nums">
                            {formatCount(item.pvCount)}번
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                    해당 {RANK_UNIT_LABELS[filters.dateChoice]}에는 데이터가
                    없습니다.
                  </p>
                )}
              </div>
            ))}
          </div>
          <ChunkPagination
            page={pager.page}
            totalPages={pager.totalPages}
            canGoPrev={pager.canGoPrev}
            canGoNext={pager.canGoNext}
            onPrev={pager.goPrev}
            onNext={pager.goNext}
          />
        </>
      )}
    </div>
  );
}
