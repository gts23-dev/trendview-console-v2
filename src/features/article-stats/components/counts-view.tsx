import { Ban, FileText, LayoutGrid, MessageSquareWarning } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/shared/utils/class-name';
import { formatCount } from '@/shared/utils/format';
import { getPlatformLabel } from '@/features/articles';
import { useMediaScope } from '@/features/medias';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/common/data-table';
import { DateRangeField } from '@/components/common/date-range-field';
import { ErrorState, LoadingState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { createDailyCountColumns } from '../columns/daily-count-columns';
import {
  useArticleCounts,
  useDailyPlatformCounts,
  usePlatformCounts,
} from '../hooks/use-counts';
import {
  CONTENT_STATE,
  DAILY_PAGE_SIZE,
  DATE_CHOICES,
  getActiveLabels,
  parseCountsFilters,
  serializeCountsFilters,
  type ContentState,
  type CountsFilters,
  type DateChoice,
} from '../model/counts';
import { PLATFORM_ORDER } from '../model/platforms';
import type { ArticleCounts } from '../model/types';

const STATE_CARDS: {
  state: ContentState;
  label: string;
  colorClass: string;
  icon: typeof LayoutGrid;
}[] = [
  {
    state: CONTENT_STATE.collected,
    label: '수집',
    colorClass: 'text-emerald-600 bg-emerald-600/10',
    icon: LayoutGrid,
  },
  {
    state: CONTENT_STATE.posted,
    label: '게시',
    colorClass: 'text-blue-600 bg-blue-600/10',
    icon: FileText,
  },
  {
    state: CONTENT_STATE.reported,
    label: '신고',
    colorClass: 'text-amber-600 bg-amber-600/10',
    icon: MessageSquareWarning,
  },
  {
    state: CONTENT_STATE.deleted,
    label: '삭제',
    colorClass: 'text-red-600 bg-red-600/10',
    icon: Ban,
  },
];

const DATE_CHOICE_LABELS: Record<DateChoice, string> = {
  daily: '일간',
  weekly: '주간',
  monthly: '월간',
  custom: '기간',
};

const COUNT_BY_STATE: Record<ContentState, keyof ArticleCounts> = {
  [CONTENT_STATE.collected]: 'inactive',
  [CONTENT_STATE.posted]: 'active',
  [CONTENT_STATE.reported]: 'report',
  [CONTENT_STATE.deleted]: 'reportBlock',
};

export function CountsView() {
  const { mediaId } = useMediaScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseCountsFilters(searchParams);
  const state = filters.state as ContentState;

  function apply(next: Partial<CountsFilters>) {
    setSearchParams((current) =>
      serializeCountsFilters({ ...filters, ...next }, current),
    );
  }

  const counts = useArticleCounts(mediaId, filters);
  const platformCounts = usePlatformCounts(mediaId, state);
  const dailyCounts = useDailyPlatformCounts(mediaId, state, filters);

  const activeLabels = getActiveLabels(filters.dateChoice);
  const activeCard = STATE_CARDS.find((card) => card.state === state);
  const dailyItems = dailyCounts.data ?? [];
  const dailyStart = (filters.page - 1) * DAILY_PAGE_SIZE;
  const dailyPage = dailyItems.slice(dailyStart, dailyStart + DAILY_PAGE_SIZE);
  const dailyColumns = createDailyCountColumns();

  return (
    <div className="space-y-6 px-5 py-6 sm:px-8 lg:px-10">
      <PageHeader
        title="수집/게시/신고 개수"
        description="카드를 클릭하면 아래 플랫폼 별 누적 개수가 바뀝니다."
      />

      {counts.isError ? (
        <ErrorState retry={() => counts.refetch()} />
      ) : !counts.data ? (
        <LoadingState />
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">전체 개수</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {STATE_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.state}
                    type="button"
                    onClick={() => apply({ state: card.state, page: 1 })}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/40',
                      state === card.state &&
                        'border-primary ring-1 ring-primary',
                    )}
                  >
                    <span className={cn('rounded-full p-2', card.colorClass)}>
                      <Icon className="size-5" />
                    </span>
                    <span>
                      <span className="block text-xs text-muted-foreground">
                        {card.label}
                      </span>
                      <span className="block font-semibold tabular-nums">
                        {formatCount(counts.data[COUNT_BY_STATE[card.state]])}개
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">
              <span className={activeCard?.colorClass.split(' ')[0]}>
                {activeCard?.label}
              </span>{' '}
              플랫폼 별 전체 개수
            </h2>
            {platformCounts.isError ? (
              <ErrorState retry={() => platformCounts.refetch()} />
            ) : !platformCounts.data ? (
              <LoadingState />
            ) : (
              <div className="grid grid-cols-3 gap-3 rounded-lg border p-4 sm:grid-cols-6">
                {PLATFORM_ORDER.map((platform) => {
                  const item = platformCounts.data.find(
                    (entry) => entry.platform === platform,
                  );
                  return (
                    <div key={platform} className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {getPlatformLabel(platform)}
                      </p>
                      <p className="mt-1 font-semibold tabular-nums">
                        {formatCount(item?.count ?? 0)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">
                <span className={activeCard?.colorClass.split(' ')[0]}>
                  {activeCard?.label}
                </span>{' '}
                플랫폼 별 일간 개수
              </h2>
              <DateRangeField
                startDate={filters.startDate}
                endDate={filters.endDate}
                onChange={(startDate, endDate) =>
                  apply({ startDate, endDate, page: 1 })
                }
              />
            </div>
            <DataTable
              columns={dailyColumns}
              data={dailyPage}
              totalCount={dailyItems.length}
              page={filters.page}
              pageSize={DAILY_PAGE_SIZE}
              onPageChange={(page) => apply({ page })}
              isLoading={dailyCounts.isPending}
              emptyMessage="선택한 구간에 데이터가 없습니다."
            />
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">활성/비활성 개수</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Tabs
                  value={filters.dateChoice}
                  onValueChange={(value) =>
                    apply({ dateChoice: value as DateChoice })
                  }
                >
                  <TabsList variant="button">
                    {DATE_CHOICES.map((choice) => (
                      <TabsTrigger key={choice} value={choice}>
                        {DATE_CHOICE_LABELS[choice]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                {filters.dateChoice === 'custom' && (
                  <DateRangeField
                    startDate={filters.activeStartDate}
                    endDate={filters.activeEndDate}
                    onChange={(activeStartDate, activeEndDate) =>
                      apply({ activeStartDate, activeEndDate })
                    }
                  />
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {activeLabels.first}
                    {activeLabels.second && `,${activeLabels.second}`} 게시한
                    콘텐츠의 개수입니다.
                  </p>
                  <div
                    className={cn(
                      'grid gap-4',
                      activeLabels.second ? 'grid-cols-2' : 'grid-cols-1',
                    )}
                  >
                    <div>
                      <p className="text-xs font-medium text-blue-700">
                        {activeLabels.first} 활성화
                      </p>
                      <p className="font-semibold tabular-nums">
                        {formatCount(counts.data.todayActive)}개
                      </p>
                    </div>
                    {activeLabels.second && (
                      <div>
                        <p className="text-xs font-medium text-indigo-900">
                          {activeLabels.second} 활성화
                        </p>
                        <p className="font-semibold tabular-nums">
                          {formatCount(counts.data.yesterdayActive)}개
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {activeLabels.first}
                    {activeLabels.second && `,${activeLabels.second}`} 게시를
                    취소한 콘텐츠의 개수입니다.
                  </p>
                  <div
                    className={cn(
                      'grid gap-4',
                      activeLabels.second ? 'grid-cols-2' : 'grid-cols-1',
                    )}
                  >
                    <div>
                      <p className="text-xs font-medium text-blue-700">
                        {activeLabels.first} 비활성
                      </p>
                      <p className="font-semibold tabular-nums">
                        {formatCount(counts.data.todayInactive)}개
                      </p>
                    </div>
                    {activeLabels.second && (
                      <div>
                        <p className="text-xs font-medium text-indigo-900">
                          {activeLabels.second} 비활성
                        </p>
                        <p className="font-semibold tabular-nums">
                          {formatCount(counts.data.yesterdayInactive)}개
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
