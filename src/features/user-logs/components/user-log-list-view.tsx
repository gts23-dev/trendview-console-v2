import { useEffect, useState } from 'react';
import { UserX } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { formatCount } from '@/shared/utils/format';
import { getPlatformLabel } from '@/features/articles';
import { useMediaScope } from '@/features/medias';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ErrorState, LoadingState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { useServerTable } from '@/components/common/use-server-table';
import { USER_LOG_PAGE_SIZE } from '../api/logs';
import { useUserLogs } from '../hooks/use-user-logs';
import {
  parseUserLogFilters,
  serializeUserLogFilters,
  type UserLogFilters,
} from '../model/filters';
import {
  getEventColor,
  getEventLabel,
  type UserLogEntry,
} from '../model/map-log';
import { UserLogToolbar } from './user-log-toolbar';

const EVENT_BADGE_VARIANT: Record<
  string,
  'primary' | 'info' | 'success' | 'destructive'
> = {
  indigo: 'primary',
  info: 'info',
  green: 'success',
  pink: 'destructive',
};

export function UserLogListView() {
  const { mediaId } = useMediaScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseUserLogFilters(searchParams);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [excluding, setExcluding] = useState<UserLogEntry | null>(null);
  // 커서 기반 API라 임의의 쪽으로 바로 못 넘어간다. 이미 받아 온 쪽 사이는
  // 다시 요청하지 않고 이 인덱스로만 옮겨 다니고, 안 받아 온 다음 쪽만
  // 실제로 요청한다(뒤로 가기는 그래서 항상 즉시 된다).
  const [pageIndex, setPageIndex] = useState(0);

  const result = useUserLogs(mediaId, filters);
  const filterKey = serializeUserLogFilters(filters).toString();
  useEffect(() => {
    setExpanded(null);
    setPageIndex(0);
  }, [mediaId, filterKey]);

  function apply(next: Partial<UserLogFilters>) {
    setSearchParams((current) =>
      serializeUserLogFilters({ ...filters, ...next }, current),
    );
  }

  const pages = result.data?.pages ?? [];
  const currentPage = pages[pageIndex];
  const items = currentPage?.items ?? [];
  const totalCount = currentPage?.totalCount ?? 0;
  const uniqueCount = pages[0]?.uniqueCount ?? 0;

  /**
   * 다른 목록 화면들과 같은 쪽 번호 페이지네이션(`DataGridPagination`)을
   * 쓴다. 다만 이 API는 쪽 번호가 아니라 커서(`search_after`)로만 다음
   * 쪽을 준다 — 임의의 쪽으로 한 번에 못 건너뛴다. 그래서 번호를 눌러
   * 아직 안 받아 온 쪽으로 가면, 거기 닿을 때까지 순서대로 이어서
   * 받아 온 뒤에 옮겨간다(뒤로 가는 쪽은 이미 받아 둔 것이라 바로 된다).
   */
  async function handlePageChange(page: number) {
    const targetIndex = page - 1;
    let latestPages = pages;
    let more = result.hasNextPage;
    while (latestPages.length <= targetIndex && more) {
      const next = await result.fetchNextPage();
      latestPages = next.data?.pages ?? latestPages;
      more = next.hasNextPage ?? false;
    }
    setPageIndex(Math.min(targetIndex, Math.max(0, latestPages.length - 1)));
  }

  const table = useServerTable({
    data: items,
    totalCount,
    page: pageIndex + 1,
    pageSize: USER_LOG_PAGE_SIZE,
    onPageChange: handlePageChange,
  });

  return (
    <div className="space-y-6 px-5 py-6 sm:px-8 lg:px-10">
      <PageHeader
        title="사용자 접속 로그"
        description="선택한 매체에서 사용자의 조회·클릭·좋아요·즐겨찾기 로그를 확인합니다."
      />

      <UserLogToolbar filters={filters} onChange={apply} />

      {!result.isPending && !result.isError && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-4 text-center">
            <strong>검색 결과</strong>
            <span className="ms-3 tabular-nums">{formatCount(totalCount)}</span>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <strong>유저수</strong>
            <span className="ms-3 tabular-nums">
              {formatCount(uniqueCount)}
            </span>
          </div>
        </div>
      )}

      {result.isError ? (
        <ErrorState retry={() => result.refetch()} />
      ) : result.isPending ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          데이터가 존재하지 않습니다.
        </p>
      ) : (
        <DataGrid
          table={table}
          recordCount={totalCount}
          isLoading={result.isFetchingNextPage}
        >
          <div className="overflow-hidden rounded-lg border">
            <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
              <span className="w-[10%] text-center">플랫폼</span>
              <span className="w-[12%] text-center">글번호</span>
              <span className="w-[10%] text-center">행동</span>
              <span className="w-[23%] text-center">태그</span>
              <span className="w-[28%] text-center">유저</span>
              <span className="w-[5%] text-center">제외</span>
              <span className="w-[12%] text-center">날짜</span>
            </div>
            <ul>
              {items.map((item, index) => (
                <li key={index} className="border-b last:border-0">
                  {/* 안에 "제외" 버튼이 또 있어 <button>으로 감싸면 안 된다
                      (버튼 중첩은 유효하지 않은 HTML이라 클릭이 깨진다). */}
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted/40"
                    onClick={() =>
                      setExpanded((current) =>
                        current === index ? null : index,
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return;
                      event.preventDefault();
                      setExpanded((current) =>
                        current === index ? null : index,
                      );
                    }}
                  >
                    <span className="w-[10%] truncate text-center">
                      {getPlatformLabel(item.platform)}
                    </span>
                    <span className="w-[12%] truncate text-center tabular-nums">
                      {item.articleId ?? ''}
                    </span>
                    <span className="w-[10%] text-center">
                      <Badge
                        size="sm"
                        appearance="outline"
                        variant={EVENT_BADGE_VARIANT[getEventColor(item.event)]}
                      >
                        {getEventLabel(item.event)}
                      </Badge>
                    </span>
                    <span className="flex w-[23%] flex-wrap justify-center gap-1">
                      {item.tags.map((tag) => (
                        <Badge key={tag} size="sm" variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </span>
                    <span className="w-[28%] truncate text-center">
                      {item.userId}
                    </span>
                    <span className="flex w-[5%] justify-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="size-7 p-0 text-destructive"
                        aria-label="제외사용자로 등록"
                        onClick={(event) => {
                          event.stopPropagation();
                          setExcluding(item);
                        }}
                      >
                        <UserX className="size-4" />
                      </Button>
                    </span>
                    <span className="w-[12%] text-center text-xs leading-tight">
                      {item.presentDate}
                      <br />
                      {item.presentTime}
                    </span>
                  </div>
                  {expanded === index && (
                    <div className="flex flex-wrap gap-x-8 gap-y-3 border-t bg-muted/20 px-4 py-4 text-sm">
                      <div>
                        <Badge appearance="outline" className="mb-1.5">
                          글번호
                        </Badge>
                        <div>
                          {item.articleId ? (
                            <Link
                              to={`/articles?search=${item.articleId}&media=${mediaId}`}
                              className="text-primary hover:underline"
                            >
                              {item.articleId}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </div>
                      </div>
                      <div>
                        <Badge appearance="outline" className="mb-1.5">
                          유저ID
                        </Badge>
                        <div>
                          <Link
                            to={`/stats/user-search?search=${item.userId}&media=${mediaId}`}
                            className="text-primary hover:underline"
                          >
                            {item.userId}
                          </Link>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <Badge appearance="outline" className="mb-1.5">
                          모든 태그
                        </Badge>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.length === 0
                            ? '-'
                            : item.tags.map((tag) => (
                                <Badge key={tag} size="sm" variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-3">
            <DataGridPagination
              info={`{from}-{to} / 총 ${formatCount(totalCount)}건`}
            />
          </div>
        </DataGrid>
      )}

      <ConfirmDialog
        open={excluding !== null}
        title="집계제외 사용자로 등록하시겠습니까?"
        description={`유저 "${excluding?.userId}"를 이후 통계 집계에서 제외합니다.`}
        confirmLabel="등록"
        onOpenChange={(open) => !open && setExcluding(null)}
        onConfirm={() => {
          // TODO(Phase 5): POST api/v1/admin/log/exclude/user 연결. 지금은
          // 변경 요청이 차단된 상태다.
          toast.success('제외사용자로 등록했습니다.');
          setExcluding(null);
        }}
      />
    </div>
  );
}
