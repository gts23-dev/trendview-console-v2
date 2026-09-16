import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { formatCount } from '@/shared/utils/format';
import { useMediaScope } from '@/features/medias';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardHeading,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState, ErrorState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { useServerTable } from '@/components/common/use-server-table';
import { ARTICLE_STATE } from '../api/articles';
import { useArticleList } from '../hooks/use-articles';
import {
  ARTICLE_PAGE_SIZE,
  ARTICLE_SORTS,
  parseArticleFilters,
  serializeArticleFilters,
  type ArticleFilters,
} from '../model/filters';
import { ArticleCard, ArticleCardSkeleton } from './article-card';
import { ArticleDetailSheet } from './article-detail-sheet';
import { ArticleToolbar } from './article-toolbar';

interface ArticleListViewProps {
  /** 0: 수집정보, 1: 게시정보 */
  state: number;
  title: string;
  description: string;
  /** 주 동작. 수집정보는 활성, 게시정보는 비활성이다. */
  actionLabel: string;
  /** 주 동작을 확인할 때 보여줄 결과 설명. 개수를 받아 문장을 만든다. */
  actionDescription: (count: string) => string;
  emptyTitle: string;
  /** 화면 전체에 대한 동작. 수집정보의 수동 수집처럼 선택과 무관한 것만 둔다. */
  headerAction?: React.ReactNode;
}

/**
 * 수집정보와 게시정보는 조회 조건, 카드, 선택 동작이 같고 state와 문구만 다르다.
 * 두 화면이 갈라지면 이 컴포넌트를 쪼개는 게 맞다.
 */
export function ArticleListView({
  state,
  title,
  description,
  actionLabel,
  actionDescription,
  emptyTitle,
  headerAction,
}: ArticleListViewProps) {
  const { mediaId } = useMediaScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseArticleFilters(searchParams);
  const [selected, setSelected] = useState<number[]>([]);
  // 확인 대상은 선택 목록과 별개다. 카드나 시트의 개별 버튼이 선택을
  // 덮어쓰면 체크해 둔 항목이 사라진다.
  const [confirming, setConfirming] = useState<{
    kind: 'action' | 'delete';
    ids: number[];
  } | null>(null);
  const list = useArticleList(mediaId, state, filters);
  // 상세는 목록의 상태다. 경로를 바꾸면 닫았을 때 돌아갈 목록 조건을 잃는다.
  const openedId = Number(searchParams.get('article')) || null;

  function openArticle(id: number | null) {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (id === null) params.delete('article');
        else params.set('article', String(id));
        return params;
      },
      { replace: id === null },
    );
  }

  // 조건이나 매체가 바뀌면 이전 선택은 의미가 없다. searchParams 전체를 보면
  // 상세를 여닫는 article 파라미터에도 반응해 선택이 풀린다. 조회 조건만 본다.
  const filterKey = serializeArticleFilters(filters).toString();
  useEffect(() => {
    setSelected([]);
  }, [mediaId, filterKey]);

  function apply(next: Partial<ArticleFilters>) {
    setSearchParams(
      (current) =>
        serializeArticleFilters(
          // 조건이 바뀌면 페이지는 처음으로 돌린다.
          { ...filters, ...next, page: next.page ?? 1 },
          current,
        ),
      { replace: false },
    );
  }
  function reset() {
    setSearchParams((current) => {
      const params = new URLSearchParams();
      const media = current.get('media');
      if (media) params.set('media', media);
      return params;
    });
  }

  const items = list.data?.items ?? [];
  const searchCount = list.data?.searchCount ?? 0;
  const totalCount = list.data?.totalCount ?? 0;
  const allSelected = items.length > 0 && selected.length === items.length;
  // 카드 목록에도 표 화면과 같은 쪽 번호를 쓴다. 컬럼은 비운다.
  const table = useServerTable({
    data: items,
    totalCount: searchCount,
    page: filters.page,
    pageSize: ARTICLE_PAGE_SIZE,
    onPageChange: (page) => apply({ page }),
  });

  return (
    <div className="space-y-4 px-5 py-6 sm:px-8 lg:px-10">
      <PageHeader
        title={title}
        description={description}
        action={headerAction}
      />
      <DataGrid
        table={table}
        recordCount={searchCount}
        isLoading={list.isPending}
      >
        <Card>
          <CardHeader className="flex-wrap gap-3">
            <CardHeading className="grow">
              <ArticleToolbar
                filters={filters}
                onChange={apply}
                onReset={reset}
              />
            </CardHeading>
          </CardHeader>
          <CardContent className="space-y-4 py-5">
            <div className="flex min-h-9 flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    disabled={items.length === 0}
                    onCheckedChange={(value) =>
                      setSelected(
                        value === true ? items.map((item) => item.id) : [],
                      )
                    }
                    aria-label="현재 페이지 전체 선택"
                  />
                  전체 선택
                </label>
                <span className="text-muted-foreground">
                  {searchCount === totalCount
                    ? `${formatCount(totalCount)}개`
                    : `${formatCount(searchCount)}개 / 전체 ${formatCount(totalCount)}개`}
                </span>
              </div>
              {selected.length === 0 ? (
                <Select
                  value={filters.sort}
                  onValueChange={(value) =>
                    apply({ sort: value as ArticleFilters['sort'] })
                  }
                >
                  <SelectTrigger
                    className="h-8 w-[130px]"
                    aria-label="정렬 기준"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ARTICLE_SORTS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label} 순
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatCount(selected.length)}개 선택
                  </span>
                  <Button
                    size="sm"
                    onClick={() =>
                      setConfirming({ kind: 'action', ids: selected })
                    }
                  >
                    {actionLabel}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setConfirming({ kind: 'delete', ids: selected })
                    }
                  >
                    <Trash2 className="size-4" />
                    삭제
                  </Button>
                </div>
              )}
            </div>

            {list.isPending ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
                {Array.from({ length: ARTICLE_PAGE_SIZE }, (_, index) => (
                  <ArticleCardSkeleton key={index} />
                ))}
              </div>
            ) : list.isError ? (
              <ErrorState retry={() => list.refetch()} />
            ) : items.length === 0 ? (
              <EmptyState
                title={emptyTitle}
                description="기간이나 플랫폼 조건을 바꿔 보세요."
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
                {items.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    selected={selected.includes(article.id)}
                    showBusinessTag={state === ARTICLE_STATE.posted}
                    onSelect={(value) =>
                      setSelected((current) =>
                        value
                          ? [...current, article.id]
                          : current.filter((id) => id !== article.id),
                      )
                    }
                    onOpen={() => openArticle(article.id)}
                    action={
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setConfirming({ kind: 'action', ids: [article.id] })
                        }
                      >
                        {actionLabel}
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>

      <ArticleDetailSheet
        mediaId={mediaId}
        article={items.find((item) => item.id === openedId) ?? null}
        actionLabel={actionLabel}
        onAction={(id) => setConfirming({ kind: 'action', ids: [id] })}
        onDelete={(id) => setConfirming({ kind: 'delete', ids: [id] })}
        onClose={() => openArticle(null)}
      />

      <ConfirmDialog
        open={confirming?.kind === 'action'}
        title={`선택한 콘텐츠를 ${actionLabel}하시겠습니까?`}
        description={actionDescription(formatCount(confirming?.ids.length))}
        confirmLabel={actionLabel}
        onOpenChange={(open) => !open && setConfirming(null)}
        onConfirm={() => {
          // TODO(Phase 5): PUT api/v1/articles 연결. 지금은 변경 요청이 차단된 상태다.
          toast.success(`${actionLabel}했습니다.`);
          setSelected((current) =>
            current.filter((id) => !confirming?.ids.includes(id)),
          );
          setConfirming(null);
          openArticle(null);
        }}
      />
      <ConfirmDialog
        open={confirming?.kind === 'delete'}
        title="선택한 콘텐츠를 삭제하시겠습니까?"
        description={`${formatCount(confirming?.ids.length)}개를 삭제하면 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        destructive
        onOpenChange={(open) => !open && setConfirming(null)}
        onConfirm={() => {
          // TODO(Phase 5): DELETE api/v1/articles/delete 연결. 지금은 차단된 상태다.
          toast.success('삭제했습니다.');
          setSelected((current) =>
            current.filter((id) => !confirming?.ids.includes(id)),
          );
          setConfirming(null);
          openArticle(null);
        }}
      />
    </div>
  );
}
