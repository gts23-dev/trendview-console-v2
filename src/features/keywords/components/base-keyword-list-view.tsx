import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ScrapButton } from '@/features/articles';
import { useMediaScope } from '@/features/medias';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { DataTable } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { SearchField } from '@/components/common/search-field';
import { createBaseKeywordColumns } from '../columns/base-keyword-columns';
import {
  useBaseKeywordList,
  useDeleteBaseKeyword,
  useSaveBaseKeyword,
  useToggleBaseKeywordState,
} from '../hooks/use-base-keywords';
import {
  BASE_KEYWORD_PAGE_SIZE,
  parseBaseKeywordFilters,
  serializeBaseKeywordFilters,
  type BaseKeywordFilters,
} from '../model/filters';
import type { BaseKeyword } from '../model/types';
import { BaseKeywordFormDialog } from './base-keyword-form-dialog';

export function BaseKeywordListView() {
  const { mediaId, medias } = useMediaScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseBaseKeywordFilters(searchParams);
  // null이면 등록, 값이 있으면 그 항목 수정이다.
  const [editing, setEditing] = useState<BaseKeyword | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<BaseKeyword | null>(null);
  const list = useBaseKeywordList(mediaId, filters);
  const save = useSaveBaseKeyword();
  const remove = useDeleteBaseKeyword();
  const toggle = useToggleBaseKeywordState();

  function apply(next: Partial<BaseKeywordFilters>) {
    setSearchParams((current) =>
      serializeBaseKeywordFilters(
        // 조건이 바뀌면 쪽은 처음으로 돌린다.
        { ...filters, ...next, page: next.page ?? 1 },
        current,
      ),
    );
  }

  const mediaNames = useMemo(
    () => Object.fromEntries(medias.map((media) => [media.id, media.name])),
    [medias],
  );
  const items = list.data?.items ?? [];
  const totalCount = list.data?.totalCount ?? 0;
  const columns = useMemo(
    () =>
      createBaseKeywordColumns({
        totalCount,
        page: filters.page,
        mediaNames,
        pendingId: toggle.isPending ? (toggle.variables ?? null) : null,
        onEdit: (keyword) => {
          setEditing(keyword);
          setFormOpen(true);
        },
        onDelete: setDeleting,
        onToggle: (keyword) => toggle.mutate(keyword.id),
      }),
    [totalCount, filters.page, mediaNames, toggle],
  );

  return (
    <div className="space-y-5 px-5 py-6 sm:px-8 lg:px-10">
      <PageHeader
        title="키워드(PK) 관리"
        description="이 키워드로 플랫폼에서 콘텐츠를 수집합니다. 매체마다 따로 관리합니다."
      />

      <DataTable
        columns={columns}
        data={items}
        totalCount={totalCount}
        page={filters.page}
        pageSize={BASE_KEYWORD_PAGE_SIZE}
        onPageChange={(page) => apply({ page })}
        isLoading={list.isPending}
        emptyMessage={
          filters.search ? '검색 결과가 없습니다.' : '등록된 키워드가 없습니다.'
        }
        toolbar={
          <>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus />
              키워드(PK) 등록
            </Button>
            <ScrapButton />
            <SearchField
              value={filters.search}
              placeholder="키워드 검색"
              onSearch={(search) => apply({ search })}
            />
          </>
        }
      />

      <BaseKeywordFormDialog
        open={formOpen}
        keyword={editing}
        mediaId={mediaId}
        pending={save.isPending}
        onOpenChange={setFormOpen}
        onSubmit={(values) => {
          if (mediaId === null) return;
          save.mutate(
            { id: editing?.id, mediaId, ...values },
            {
              onSuccess: () => {
                toast.success(editing ? '수정했습니다.' : '등록했습니다.');
                setFormOpen(false);
              },
            },
          );
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="이 키워드를 삭제하시겠습니까?"
        description={`${deleting?.keyword ?? ''}을(를) 지우면 되돌릴 수 없습니다.`}
        pending={remove.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(
            {
              id: deleting.id,
              mediaId: deleting.mediaId,
              keyword: deleting.keyword,
            },
            {
              onSuccess: () => {
                toast.success('삭제했습니다.');
                setDeleting(null);
              },
            },
          );
        }}
      />
    </div>
  );
}
