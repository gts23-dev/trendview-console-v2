import { useState } from 'react';
import { BookmarkX, Crown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { formatCount } from '@/shared/utils/format';
import { useMediaScope } from '@/features/medias';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChunkPagination } from '@/components/common/chunk-pagination';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { DateRangeField } from '@/components/common/date-range-field';
import { ErrorState, LoadingState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { useChunkPager } from '@/components/common/use-chunk-pager';
import { useTagBusinessStats, useTagDailyStats } from '../hooks/use-tag-ranks';
import {
  defaultRangeForTagRankChoice,
  parseTagRankFilters,
  RANK_DATE_CHOICES,
  serializeTagRankFilters,
  TAG_RANK_SORTS,
  type RankDateChoice,
  type TagRankFilters,
  type TagRankSort,
} from '../model/tag-ranks';
import { TagArticlesDialog } from './tag-articles-dialog';

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

const BUCKETS_PER_PAGE = 3;

export function TagRankView() {
  const { mediaId } = useMediaScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseTagRankFilters(searchParams);
  const [page, setPage] = useState(1);
  const [opened, setOpened] = useState<{
    tag: string;
    dateType: string;
  } | null>(null);
  const [ignoring, setIgnoring] = useState<string | null>(null);

  const ranks = useTagDailyStats(mediaId, filters);
  const businessStats = useTagBusinessStats(mediaId);

  function apply(next: Partial<TagRankFilters>) {
    setSearchParams((current) =>
      serializeTagRankFilters({ ...filters, ...next }, current),
    );
    setPage(1);
  }

  function changeDateChoice(dateChoice: RankDateChoice) {
    apply({ dateChoice, ...defaultRangeForTagRankChoice(dateChoice) });
  }

  const buckets = ranks.data ?? [];
  const pager = useChunkPager(buckets, {
    page,
    pageSize: BUCKETS_PER_PAGE,
    onPageChange: setPage,
  });

  const businessItems = businessStats.data ?? [];

  return (
    <div className="space-y-5 px-5 py-6 sm:px-8 lg:px-10">
      <PageHeader
        title="키워드(PK) 순위"
        description="순위는 100위까지 보여주며, 회원이 유입된 콘텐츠의 키워드(PK)를 집계하여 순위를 보여줍니다."
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Select
          value={filters.sort}
          onValueChange={(value) => apply({ sort: value as TagRankSort })}
        >
          <SelectTrigger className="w-[140px]" aria-label="정렬 기준">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAG_RANK_SORTS.map((option) => (
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
          <div className="grid gap-4 md:grid-cols-3">
            {pager.pageItems.map((bucket, i) => (
              <div key={pager.pageStartIndex + i} className="rounded-lg border">
                <div className="border-b px-4 py-3 font-semibold">
                  {bucket.dateLabel}
                </div>
                <div className="flex border-b bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground">
                  <span className="w-[15%] text-center">순위</span>
                  <span className="w-[37%] text-center">태그</span>
                  <span className="w-[16%] text-center">UV</span>
                  <span className="w-[16%] text-center">PV</span>
                  <span className="w-[16%] text-center">제외</span>
                </div>
                {bucket.hasData ? (
                  <ul className="max-h-[26rem] overflow-y-auto">
                    {bucket.items.map((item) => (
                      <li
                        key={item.rank}
                        className="flex items-center border-b px-4 py-2 text-sm last:border-0"
                      >
                        <span className="flex w-[15%] items-center justify-center gap-1 tabular-nums">
                          {item.rank === 1 && (
                            <Crown className="size-4 text-amber-500" />
                          )}
                          {item.rank}위
                        </span>
                        <button
                          type="button"
                          className="w-[37%] cursor-pointer truncate text-center hover:underline"
                          title="클릭 시 게시정보를 확인할 수 있습니다."
                          onClick={() =>
                            setOpened({
                              tag: item.tag,
                              dateType: bucket.dateType,
                            })
                          }
                        >
                          {item.tag}
                        </button>
                        <span className="w-[16%] text-center tabular-nums">
                          {formatCount(item.uvCount)}번
                        </span>
                        <span className="w-[16%] text-center tabular-nums">
                          {formatCount(item.pvCount)}번
                        </span>
                        <span className="flex w-[16%] justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-7 p-0 text-destructive"
                            aria-label={`${item.tag} 제외`}
                            onClick={() => setIgnoring(item.tag)}
                          >
                            <BookmarkX className="size-4" />
                          </Button>
                        </span>
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

      <div className="space-y-3 pt-4">
        <PageHeader
          title="키워드(PK) 콘텐츠 매칭 순위"
          description="가장 많이 콘텐츠와 매칭된 비즈니스태그를 보여줍니다."
        />
        {businessStats.isError ? (
          <ErrorState retry={() => businessStats.refetch()} />
        ) : businessStats.isPending ? (
          <LoadingState />
        ) : businessItems.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            데이터가 없습니다.
          </p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {businessItems.map((item) => (
                    <TableHead key={item.tag} className="text-center">
                      {item.tag}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {businessItems.map((item) => (
                    <TableCell key={item.tag} className="text-center">
                      {formatCount(item.count)}개
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <TagArticlesDialog
        open={opened !== null}
        onOpenChange={(next) => !next && setOpened(null)}
        mediaId={mediaId}
        tag={opened?.tag ?? null}
        dateChoice={filters.dateChoice}
        dateType={opened?.dateType ?? ''}
      />

      <ConfirmDialog
        open={ignoring !== null}
        title={`"${ignoring}" 태그를 제외하시겠습니까?`}
        description="이후 집계에서 이 태그가 순위에 나타나지 않습니다."
        confirmLabel="제외"
        onOpenChange={(open) => !open && setIgnoring(null)}
        onConfirm={() => {
          // TODO(Phase 5): POST api/v1/tags/ignore 연결. 지금은 변경 요청이
          // 차단된 상태다.
          toast.success(`"${ignoring}" 태그를 제외했습니다.`);
          setIgnoring(null);
        }}
      />
    </div>
  );
}
