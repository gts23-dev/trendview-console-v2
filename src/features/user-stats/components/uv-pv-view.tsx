import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/shared/utils/class-name';
import { formatCount } from '@/shared/utils/format';
import { getPlatformLabel } from '@/features/articles';
import { useMediaScope } from '@/features/medias';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChunkPagination } from '@/components/common/chunk-pagination';
import { DataTable } from '@/components/common/data-table';
import { DateRangeField } from '@/components/common/date-range-field';
import { ErrorState, LoadingState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { useChunkPager } from '@/components/common/use-chunk-pager';
import { createUvPvColumns } from '../columns/uv-pv-columns';
import {
  usePlatformPageViewStats,
  useUserPageViewStats,
  useUvPvStats,
} from '../hooks/use-uv-pv';
import {
  defaultRangeForUvPvChoice,
  parseUvPvFilters,
  RANK_DATE_CHOICES,
  serializeUvPvFilters,
  type RankDateChoice,
  type UvPvFilters,
} from '../model/uv-pv';
import { UvPvChart } from './uv-pv-chart';

const DATE_CHOICE_LABELS: Record<RankDateChoice, string> = {
  daily: '일간',
  weekly: '주간',
  monthly: '월간',
};

const UV_PV_PAGE_SIZE = 5;
const BUCKET_PAGE_SIZE = 4;

export function UvPvView() {
  const { mediaId } = useMediaScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseUvPvFilters(searchParams);

  const [uvPvPage, setUvPvPage] = useState(1);
  const [userPvPage, setUserPvPage] = useState(1);
  const [platformPvPage, setPlatformPvPage] = useState(1);

  function apply(next: Partial<UvPvFilters>) {
    setSearchParams((current) =>
      serializeUvPvFilters({ ...filters, ...next }, current),
    );
    setUvPvPage(1);
    setUserPvPage(1);
    setPlatformPvPage(1);
  }

  function changeDateChoice(dateChoice: RankDateChoice) {
    apply({ dateChoice, ...defaultRangeForUvPvChoice(dateChoice) });
  }

  const uvPv = useUvPvStats(mediaId, filters);
  const userPv = useUserPageViewStats(mediaId, filters);
  const platformPv = usePlatformPageViewStats(mediaId, filters);

  const uvPvItems = uvPv.data ?? [];
  // 표는 서버가 준 순서(최신순) 그대로, 차트만 시간순으로 뒤집는다.
  const chartPoints = [...uvPvItems].reverse();
  const uvPvColumns = createUvPvColumns();

  const userBuckets = userPv.data ?? [];
  const userPager = useChunkPager(userBuckets, {
    page: userPvPage,
    pageSize: BUCKET_PAGE_SIZE,
    onPageChange: setUserPvPage,
  });

  const platformBuckets = platformPv.data ?? [];
  const platformPager = useChunkPager(platformBuckets, {
    page: platformPvPage,
    pageSize: BUCKET_PAGE_SIZE,
    onPageChange: setPlatformPvPage,
  });

  return (
    <div className="space-y-6 px-5 py-6 sm:px-8 lg:px-10">
      <PageHeader
        title="일간 사용자 유입량"
        description="매체에 유입된 사용자 수를 UV·PV 기준으로 보여줍니다."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              value={filters.dateChoice}
              onValueChange={(value) =>
                changeDateChoice(value as RankDateChoice)
              }
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
        }
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">UV &amp; PV</h2>
        {uvPv.isError ? (
          <ErrorState retry={() => uvPv.refetch()} />
        ) : uvPv.isPending ? (
          <LoadingState />
        ) : (
          <div className="space-y-4 rounded-lg border p-4">
            <UvPvChart points={chartPoints} />
            <DataTable
              columns={uvPvColumns}
              data={uvPvItems.slice(
                (uvPvPage - 1) * UV_PV_PAGE_SIZE,
                uvPvPage * UV_PV_PAGE_SIZE,
              )}
              totalCount={uvPvItems.length}
              page={uvPvPage}
              pageSize={UV_PV_PAGE_SIZE}
              onPageChange={setUvPvPage}
              emptyMessage="선택한 구간에 데이터가 없습니다."
            />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          사용자별 PV (<span className="text-blue-700">■ 회원</span> /{' '}
          <span className="text-muted-foreground">■ 비회원</span>)
        </h2>
        {userPv.isError ? (
          <ErrorState retry={() => userPv.refetch()} />
        ) : userPv.isPending ? (
          <LoadingState />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {userPager.pageItems.map((bucket, i) => (
                <div
                  key={userPager.pageStartIndex + i}
                  className="rounded-lg border"
                >
                  <div className="border-b px-4 py-3 font-semibold">
                    {bucket.dateLabel}
                  </div>
                  <div className="flex justify-between border-b bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground">
                    <span>사용자 아이디</span>
                    <span>PV</span>
                  </div>
                  {bucket.users && bucket.users.length > 0 ? (
                    <ul className="max-h-[26rem] overflow-y-auto">
                      {bucket.users.map((user) => (
                        <li
                          key={user.userId}
                          className="flex justify-between border-b px-4 py-2 text-sm last:border-0"
                        >
                          <span
                            className={cn(
                              'truncate',
                              user.isMember
                                ? 'text-blue-700'
                                : 'text-muted-foreground',
                            )}
                          >
                            {user.userId}
                          </span>
                          <span className="tabular-nums">
                            {formatCount(user.count)}번
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                      해당 구간에는 데이터가 없습니다.
                    </p>
                  )}
                </div>
              ))}
            </div>
            <ChunkPagination
              page={userPager.page}
              totalPages={userPager.totalPages}
              canGoPrev={userPager.canGoPrev}
              canGoNext={userPager.canGoNext}
              onPrev={userPager.goPrev}
              onNext={userPager.goNext}
            />
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">플랫폼별 게시글 조회수</h2>
        {platformPv.isError ? (
          <ErrorState retry={() => platformPv.refetch()} />
        ) : platformPv.isPending ? (
          <LoadingState />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {platformPager.pageItems.map((bucket, i) => (
                <div
                  key={platformPager.pageStartIndex + i}
                  className="rounded-lg border"
                >
                  <div className="border-b px-4 py-3 font-semibold">
                    {bucket.dateLabel}
                  </div>
                  <div className="flex justify-between border-b bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground">
                    <span>플랫폼</span>
                    <span>게시글 조회수</span>
                  </div>
                  {bucket.platforms && bucket.platforms.length > 0 ? (
                    <ul>
                      {bucket.platforms.map((platform) => (
                        <li
                          key={platform.platform}
                          className="flex justify-between border-b px-4 py-2 text-sm last:border-0"
                        >
                          <span>{getPlatformLabel(platform.platform)}</span>
                          <span className="tabular-nums">
                            {formatCount(platform.count)}번
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                      해당 구간에는 데이터가 없습니다.
                    </p>
                  )}
                </div>
              ))}
            </div>
            <ChunkPagination
              page={platformPager.page}
              totalPages={platformPager.totalPages}
              canGoPrev={platformPager.canGoPrev}
              canGoNext={platformPager.canGoNext}
              onPrev={platformPager.goPrev}
              onNext={platformPager.goNext}
            />
          </>
        )}
      </section>
    </div>
  );
}
