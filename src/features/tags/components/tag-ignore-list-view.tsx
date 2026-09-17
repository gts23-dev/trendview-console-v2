import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useMediaScope } from '@/features/medias';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { DataTable } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { SearchField } from '@/components/common/search-field';
import { createTagIgnoreColumns } from '../columns/tag-ignore-columns';
import {
  useDeleteTagIgnore,
  useTagIgnoreList,
  useToggleTagIgnore,
} from '../hooks/use-tag-ignores';
import {
  IGNORE_FILTERS,
  parseTagIgnoreFilters,
  serializeTagIgnoreFilters,
  TAG_IGNORE_PAGE_SIZE,
  type TagIgnoreFilters,
} from '../model/filters';
import type { TagIgnore } from '../model/types';

export function TagIgnoreListView() {
  const { mediaId } = useMediaScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseTagIgnoreFilters(searchParams);
  const [deleting, setDeleting] = useState<TagIgnore | null>(null);
  const list = useTagIgnoreList(mediaId, filters);
  const toggle = useToggleTagIgnore();
  const remove = useDeleteTagIgnore();

  function apply(next: Partial<TagIgnoreFilters>) {
    setSearchParams((current) =>
      serializeTagIgnoreFilters(
        // 조건이 바뀌면 쪽은 처음으로 돌린다.
        { ...filters, ...next, page: next.page ?? 1 },
        current,
      ),
    );
  }

  const items = list.data?.items ?? [];
  const totalCount = list.data?.totalCount ?? 0;
  const columns = useMemo(
    () =>
      createTagIgnoreColumns({
        totalCount,
        page: filters.page,
        pendingId: toggle.isPending ? (toggle.variables ?? null) : null,
        onToggle: (tag) => toggle.mutate(tag.id),
        onDelete: (tag) => setDeleting(tag),
      }),
    [totalCount, filters.page, toggle],
  );

  return (
    <div className="space-y-5 px-5 py-6 sm:px-8 lg:px-10">
      <PageHeader
        title="키워드(PK) 제외"
        description="수집한 태그 중 통계와 노출에서 뺄 항목을 관리합니다."
      />

      <DataTable
        columns={columns}
        data={items}
        totalCount={totalCount}
        page={filters.page}
        pageSize={TAG_IGNORE_PAGE_SIZE}
        onPageChange={(page) => apply({ page })}
        isLoading={list.isPending}
        emptyMessage={
          filters.search || filters.ignore
            ? '조건에 맞는 태그가 없습니다.'
            : '제외 목록이 비어 있습니다.'
        }
        heading={
          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              value={filters.ignore || 'all'}
              onValueChange={(value) =>
                apply({
                  ignore: (value === 'all'
                    ? ''
                    : value) as TagIgnoreFilters['ignore'],
                })
              }
            >
              <SelectTrigger className="w-32" aria-label="제외여부">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IGNORE_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value || 'all'}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        toolbar={
          <SearchField
            value={filters.search}
            placeholder="태그 검색"
            onSearch={(search) => apply({ search })}
          />
        }
      />

      <ConfirmDialog
        open={deleting !== null}
        title="이 태그를 제외 목록에서 지우시겠습니까?"
        description={`${deleting?.tag ?? ''}을(를) 지우면 되돌릴 수 없습니다.`}
        pending={remove.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(
            { mediaId: deleting.mediaId, tag: deleting.tag },
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
