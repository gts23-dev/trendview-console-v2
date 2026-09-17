import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useMediaScope } from '@/features/medias';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { createTopicColumns } from '../columns/topic-columns';
import { useSaveTopic, useTopicList } from '../hooks/use-topics';
import {
  parseTopicFilters,
  serializeTopicFilters,
  TOPIC_PAGE_SIZE,
  type TopicFilters,
} from '../model/filters';
import type { Topic } from '../model/types';
import { TopicFormDialog } from './topic-form-dialog';

export function TopicListView() {
  const { mediaId } = useMediaScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseTopicFilters(searchParams);
  // null이면 등록, 값이 있으면 그 항목 수정이다.
  const [editing, setEditing] = useState<Topic | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const list = useTopicList(mediaId, filters);
  const save = useSaveTopic();

  function apply(next: Partial<TopicFilters>) {
    setSearchParams((current) =>
      serializeTopicFilters(
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
      createTopicColumns(totalCount, filters.page, (topic) => {
        setEditing(topic);
        setFormOpen(true);
      }),
    [totalCount, filters.page],
  );

  return (
    <div className="space-y-5 px-5 py-6 sm:px-8 lg:px-10">
      <PageHeader
        title="카테고리 관리"
        description="키워드(PK)를 묶는 분류입니다. 매체마다 따로 관리합니다."
      />

      <DataTable
        columns={columns}
        data={items}
        totalCount={totalCount}
        page={filters.page}
        pageSize={TOPIC_PAGE_SIZE}
        onPageChange={(page) => apply({ page })}
        isLoading={list.isPending}
        emptyMessage={
          filters.search
            ? '검색 결과가 없습니다.'
            : '등록된 카테고리가 없습니다.'
        }
        heading={
          <TopicSearchField
            search={filters.search}
            onSearch={(search) => apply({ search })}
          />
        }
        toolbar={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus />
            카테고리 추가
          </Button>
        }
      />

      <TopicFormDialog
        open={formOpen}
        topic={editing}
        pending={save.isPending}
        onOpenChange={setFormOpen}
        onSubmit={(name) => {
          if (mediaId === null) return;
          save.mutate(
            { id: editing?.id, mediaId, topic: name },
            {
              onSuccess: () => {
                toast.success(editing ? '수정했습니다.' : '추가했습니다.');
                setFormOpen(false);
              },
            },
          );
        }}
      />
    </div>
  );
}

interface TopicSearchFieldProps {
  search: string;
  onSearch: (search: string) => void;
}

function TopicSearchField({ search, onSearch }: TopicSearchFieldProps) {
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
        placeholder="카테고리 검색"
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
