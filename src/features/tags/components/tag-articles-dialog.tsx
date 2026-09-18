import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPlatformLabel } from '@/features/articles';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorState, LoadingState } from '@/components/common/empty-state';
import { useServerTable } from '@/components/common/use-server-table';
import { useTagArticles } from '../hooks/use-tag-articles';
import { TAG_ARTICLE_PAGE_SIZE } from '../model/tag-articles';
import type { RankDateChoice } from '../model/tag-ranks';

interface TagArticlesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaId: number | null;
  tag: string | null;
  dateChoice: RankDateChoice;
  /** 표시용 라벨이 아니라 bucket.dateType(서버가 준 원래 구간 값)이어야 한다. */
  dateType: string;
}

export function TagArticlesDialog({
  open,
  onOpenChange,
  mediaId,
  tag,
  dateChoice,
  dateType,
}: TagArticlesDialogProps) {
  const [page, setPage] = useState(1);
  // 태그나 구간이 바뀌면(같은 대화상자를 다시 여는 경우 포함) 1쪽으로 되돌린다.
  useEffect(() => {
    setPage(1);
  }, [tag, dateType]);

  const query =
    open && tag !== null && mediaId !== null
      ? { tag, mediaId, dateChoice, searchDate: dateType, page }
      : null;
  const result = useTagArticles(query);
  const items = result.data?.items ?? [];
  const totalCount = result.data?.totalCount ?? 0;
  const table = useServerTable({
    data: items,
    totalCount,
    page,
    pageSize: TAG_ARTICLE_PAGE_SIZE,
    onPageChange: setPage,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>&quot;{tag}&quot; 게시정보</DialogTitle>
        </DialogHeader>
        <DialogBody className="overflow-y-auto">
          <DataGrid
            table={table}
            recordCount={totalCount}
            isLoading={result.isPending}
          >
            {result.isError ? (
              <ErrorState retry={() => result.refetch()} />
            ) : result.isPending ? (
              <LoadingState />
            ) : items.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                데이터가 존재하지 않습니다.
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((article) => (
                    <Link
                      key={article.id}
                      to={`/articles?search=${article.id}&media=${mediaId}`}
                      onClick={() => onOpenChange(false)}
                      className="flex gap-3 rounded-lg border p-2 hover:bg-muted/40"
                    >
                      <span className="relative size-24 shrink-0 overflow-hidden rounded bg-muted">
                        {article.imageUrl ? (
                          <img
                            src={article.imageUrl}
                            alt=""
                            loading="lazy"
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="flex size-full items-center justify-center text-muted-foreground">
                            <ImageOff className="size-5" />
                          </span>
                        )}
                      </span>
                      <span className="flex min-w-0 flex-col gap-1 py-0.5">
                        <span className="text-xs text-muted-foreground">
                          {getPlatformLabel(article.platform)} · {article.date}
                        </span>
                        {article.title && (
                          <span className="line-clamp-2 text-sm font-medium">
                            {article.title}
                          </span>
                        )}
                        <span className="line-clamp-1 text-xs text-muted-foreground">
                          {article.contents}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {article.businessTag}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="mt-4">
                  <DataGridPagination />
                </div>
              </>
            )}
          </DataGrid>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
