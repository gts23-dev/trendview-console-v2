import { useEffect, useState } from 'react';
import { Crown, Eye, MousePointerClick, Star, ThumbsUp } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { formatCount } from '@/shared/utils/format';
import { getPlatformLabel } from '@/features/articles';
import { useMediaScope } from '@/features/medias';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { DateRangeField } from '@/components/common/date-range-field';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { useUserSearchDetail } from '../hooks/use-user-search';
import {
  parseUserSearchFilters,
  serializeUserSearchFilters,
  type UserSearchFilters,
} from '../model/user-search';

const EVENT_LABELS: Record<string, string> = {
  visit: '조회',
  click: '클릭',
  like: '좋아요',
  favorite: '즐겨찾기',
};

const EVENT_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  visit: Eye,
  click: MousePointerClick,
  like: ThumbsUp,
  favorite: Star,
};

export function UserSearchView() {
  const { mediaId } = useMediaScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseUserSearchFilters(searchParams);
  const [search, setSearch] = useState(filters.search);
  useEffect(() => setSearch(filters.search), [filters.search]);
  const [resetting, setResetting] = useState(false);

  const result = useUserSearchDetail(mediaId, filters);

  function apply(next: Partial<UserSearchFilters>) {
    setSearchParams((current) =>
      serializeUserSearchFilters({ ...filters, ...next }, current),
    );
  }

  return (
    <div className="space-y-6 px-5 py-6 sm:px-8 lg:px-10">
      <PageHeader
        title="사용자 검색"
        description="최고관리자만 사용할 수 있는 메뉴입니다. 정확한 회원 아이디를 입력하면 관련 데이터를 보여줍니다."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeField
              startDate={filters.startDate}
              endDate={filters.endDate}
              onChange={(startDate, endDate) => apply({ startDate, endDate })}
            />
            <form
              className="flex items-center gap-1.5"
              onSubmit={(event) => {
                event.preventDefault();
                apply({ search });
              }}
            >
              <Input
                type="search"
                className="w-[220px]"
                placeholder="정확한 사용자 아이디만 입력"
                aria-label="사용자 아이디 검색"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Button type="submit" variant="outline" size="sm">
                검색
              </Button>
            </form>
          </div>
        }
      />

      {filters.search === '' ? (
        <EmptyState
          title="검색어를 입력해 주세요"
          description="정확한 사용자 아이디를 입력하고 검색하면 관련 데이터를 보여줍니다."
        />
      ) : result.isError ? (
        <ErrorState retry={() => result.refetch()} />
      ) : result.isPending ? (
        <LoadingState />
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">이벤트 집계</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {result.data.events.map((item) => {
                const Icon = EVENT_ICONS[item.event] ?? Eye;
                return (
                  <div
                    key={item.event}
                    className="flex items-center gap-3 rounded-lg border p-4"
                  >
                    <Icon className="size-5 text-muted-foreground" />
                    <span className="font-semibold">
                      {EVENT_LABELS[item.event] ?? item.event}
                    </span>
                    <span className="ms-auto text-muted-foreground tabular-nums">
                      {formatCount(item.count)}번
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">플랫폼 집계</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {result.data.platforms.map((item) => (
                <div
                  key={item.platform}
                  className="flex items-center gap-3 rounded-lg border p-4"
                >
                  <span className="font-semibold">
                    {getPlatformLabel(item.platform)}
                  </span>
                  <span className="ms-auto text-muted-foreground tabular-nums">
                    {formatCount(item.count)}번
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">
              콘텐츠 순위
              <span className="ms-2 text-xs font-normal text-muted-foreground">
                순위는 100위까지 보여주며, 검색한 회원이 유입된 콘텐츠를
                집계하여 순위를 보여줍니다. 인스타그램은 콘텐츠 영역에 내용이,
                그 외 플랫폼은 제목이 나옵니다. 단, 비활성 된 콘텐츠는
                제외됩니다.
              </span>
            </h2>
            <div className="max-h-[300px] overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[15%] text-center">순위</TableHead>
                    <TableHead className="w-[20%]">플랫폼</TableHead>
                    <TableHead className="w-[50%]">콘텐츠</TableHead>
                    <TableHead className="w-[15%]">횟수</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.data.articles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    result.data.articles.map((item) => (
                      <TableRow key={item.rank} className="cursor-pointer">
                        <TableCell className="text-center tabular-nums">
                          <Link
                            to={`/articles?search=${item.articleId}&media=${mediaId}`}
                            className="flex items-center justify-center gap-1"
                          >
                            {item.rank === 1 && (
                              <Crown className="size-4 text-amber-500" />
                            )}
                            {item.rank}위
                          </Link>
                        </TableCell>
                        <TableCell>
                          {item.platform ? getPlatformLabel(item.platform) : ''}
                        </TableCell>
                        <TableCell className="truncate">
                          <Link
                            to={`/articles?search=${item.articleId}&media=${mediaId}`}
                          >
                            {item.text}
                          </Link>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatCount(item.count)}번
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                키워드(PK) 순위
                <span className="ms-2 text-xs font-normal text-muted-foreground">
                  순위는 100위까지 보여주며, 검색한 회원이 유입된 콘텐츠의
                  키워드(PK)를 집계하여 순위를 보여줍니다.
                </span>
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setResetting(true)}
              >
                스코어링 초기화
              </Button>
            </div>
            <div className="max-h-[300px] overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3 text-center">순위</TableHead>
                    <TableHead className="w-1/3">태그</TableHead>
                    <TableHead className="w-1/3 text-right">횟수</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.data.tags.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    result.data.tags.map((item) => (
                      <TableRow key={item.rank}>
                        <TableCell className="text-center tabular-nums">
                          {item.rank === 1 && (
                            <Crown className="mr-1 inline size-4 text-amber-500" />
                          )}
                          {item.rank}위
                        </TableCell>
                        <TableCell>{item.tag}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCount(item.count)}번
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}

      <ConfirmDialog
        open={resetting}
        title="스코어링을 초기화하시겠습니까?"
        description={`"${filters.search}" 사용자의 키워드(PK) 집계 점수를 모두 초기화합니다. 되돌릴 수 없습니다.`}
        confirmLabel="초기화"
        onOpenChange={setResetting}
        onConfirm={() => {
          // TODO(Phase 5): POST api/v1/tags/user/stats/reset 연결. 지금은
          // 변경 요청이 차단된 상태다.
          toast.success('스코어링을 초기화했습니다.');
          setResetting(false);
        }}
      />
    </div>
  );
}
