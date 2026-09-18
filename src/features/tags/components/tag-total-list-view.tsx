import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useMediaScope } from '@/features/medias';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/data-table';
import { DateRangeField } from '@/components/common/date-range-field';
import { ErrorState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { createTagTotalColumns } from '../columns/tag-total-columns';
import { useTagTotalList } from '../hooks/use-tag-totals';
import {
  parseTagTotalFilters,
  serializeTagTotalFilters,
  TAG_TOTAL_PAGE_SIZE,
  type TagTotalFilters,
} from '../model/filters';

export function TagTotalListView() {
  const { mediaId } = useMediaScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseTagTotalFilters(searchParams);
  const list = useTagTotalList(mediaId, filters);

  function apply(next: Partial<TagTotalFilters>) {
    setSearchParams((current) =>
      serializeTagTotalFilters(
        { ...filters, ...next, page: next.page ?? 1 },
        current,
      ),
    );
  }

  const items = list.data?.items ?? [];
  const totalCount = list.data?.totalCount ?? 0;
  const columns = createTagTotalColumns(
    totalCount,
    filters.page,
    filters.search,
    { tagOrder: filters.tagOrder, sumOrder: filters.sumOrder },
    {
      // 태그순 정렬로 바꾸면 집계순 정렬은 끈다. 기존 콘솔과 같은 동작이다.
      onToggleTagOrder: () =>
        apply({
          tagOrder: filters.tagOrder === 'asc' ? 'desc' : 'asc',
          sumOrder: '',
        }),
      onToggleSumOrder: () =>
        apply({ sumOrder: filters.sumOrder === 'asc' ? 'desc' : 'asc' }),
    },
  );

  return (
    <div className="space-y-5 px-5 py-6 sm:px-8 lg:px-10">
      <PageHeader
        title="키워드(PK) 집계"
        description="선택한 구간에 수집된 키워드(PK)별 건수입니다."
      />

      {list.isError ? (
        <ErrorState retry={() => list.refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          totalCount={totalCount}
          page={filters.page}
          pageSize={TAG_TOTAL_PAGE_SIZE}
          onPageChange={(page) => apply({ page })}
          isLoading={list.isPending}
          emptyMessage={
            filters.search
              ? '검색 결과가 없습니다.'
              : '선택한 구간에 데이터가 없습니다.'
          }
          heading={
            <div className="flex flex-wrap items-center gap-2">
              <DateRangeField
                startDate={filters.startDate}
                endDate={filters.endDate}
                onChange={(startDate, endDate) => apply({ startDate, endDate })}
              />
              <TagTotalSearchField
                search={filters.search}
                onSearch={(search) => apply({ search })}
              />
            </div>
          }
        />
      )}
    </div>
  );
}

interface TagTotalSearchFieldProps {
  search: string;
  onSearch: (search: string) => void;
}

function TagTotalSearchField({ search, onSearch }: TagTotalSearchFieldProps) {
  // 검색어는 Enter로 확정할 때까지 입력 중 상태로 둔다.
  const [value, setValue] = useState(search);
  useEffect(() => setValue(search), [search]);

  return (
    <form
      className="relative"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(value.trim());
      }}
    >
      <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        placeholder="태그 검색"
        className="w-48 ps-9"
        onChange={(event) => setValue(event.target.value)}
      />
      {value.length > 0 && (
        <Button
          type="button"
          mode="icon"
          variant="ghost"
          aria-label="검색어 지우기"
          className="absolute end-1.5 top-1/2 size-6 -translate-y-1/2"
          onClick={() => {
            setValue('');
            onSearch('');
          }}
        >
          <X />
        </Button>
      )}
    </form>
  );
}
