import { useEffect, useMemo, useRef, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/shared/utils/class-name';
import { canEdit, useAuth } from '@/features/auth';
import {
  createEntryColumns,
  EntryDetail,
  EntryToolbar,
  filterEntries,
  useDeleteEntries,
  useEntryList,
  type Entry,
  type EntryFilters,
} from '@/features/entries';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { readListParams } from './list-params';

const PAGE_SIZE = 8;
const EMPTY_ENTRIES: Entry[] = [];
export function EntriesPage() {
  const { session } = useAuth();
  const editable = canEdit(session);
  const [url, setUrl] = useSearchParams();
  const params = useMemo(() => readListParams(url), [url]);
  const { data = EMPTY_ENTRIES, isPending, isError, refetch } = useEntryList();
  const [selected, setSelected] = useState<string[]>([]);
  const selectionScope = `${params.page}:${params.search}:${params.status}:${params.sort}`;
  useEffect(() => setSelected([]), [selectionScope]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const filtered = useMemo(() => filterEntries(data, params), [data, params]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(params.page, totalPages);
  const rows = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );
  const detail = data.find((entry) => entry.id === url.get('detail'));
  const returnTo = `/entries?${url.toString()}`;
  const columns = useMemo(
    () =>
      createEntryColumns((entry, target) => {
        detailTrigger.current = target;
        setUrl((previous) => {
          const next = new URLSearchParams(previous);
          next.set('detail', entry.id);
          return next;
        });
      }),
    [setUrl],
  );
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
  });
  function apply(patch: Partial<EntryFilters>) {
    setSelected([]);
    const next = new URLSearchParams(url);
    next.delete('detail');
    Object.entries(patch).forEach(([key, value]) => {
      if (value === '' || value === 'all' || (key === 'page' && value === 1))
        next.delete(key);
      else next.set(key, String(value));
    });
    setUrl(next);
  }
  const remove = useDeleteEntries();
  function handleDelete() {
    remove.mutate(selected, {
      onSuccess: () => {
        setConfirmOpen(false);
        setSelected([]);
        toast.success('선택한 콘텐츠를 삭제했습니다.');
      },
    });
  }
  const tabs = [
    { value: 'all', label: '전체', count: data.length },
    {
      value: 'published',
      label: '게시 중',
      count: data.filter((x) => x.status === 'published').length,
    },
    {
      value: 'draft',
      label: '임시 저장',
      count: data.filter((x) => x.status === 'draft').length,
    },
    {
      value: 'archived',
      label: '보관',
      count: data.filter((x) => x.status === 'archived').length,
    },
  ];
  return (
    <div className="page-container">
      <PageHeader
        title="콘텐츠 관리"
        description="등록된 콘텐츠를 조회하고 상태를 관리합니다."
        eyebrow="CONTENT"
        action={
          editable && (
            <Button asChild size="lg">
              <Link to="/entries/new" state={{ returnTo }}>
                <Plus />
                콘텐츠 등록
              </Link>
            </Button>
          )
        }
      />
      <div className="panel overflow-hidden">
        <div
          className="flex overflow-x-auto border-b px-5"
          aria-label="콘텐츠 상태 필터"
        >
          {tabs.map((tab) => (
            <button
              key={tab.value}
              aria-pressed={params.status === tab.value}
              onClick={() =>
                apply({ status: tab.value as EntryFilters['status'], page: 1 })
              }
              className={cn(
                'flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-xs font-medium',
                params.status === tab.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px]',
                  params.status === tab.value ? 'bg-primary/8' : 'bg-muted',
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <EntryToolbar key={params.search} params={params} onApply={apply} />
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-5 py-2">
          <p className="text-xs text-muted-foreground">
            검색 결과{' '}
            <strong className="text-foreground">{filtered.length}</strong>건
            {params.search && ` · “${params.search}”`}
          </p>
          {selected.length ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-primary">
                {selected.length}개 선택
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 />
                선택 삭제
              </Button>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              {editable
                ? '현재 페이지의 항목을 선택할 수 있습니다'
                : '조회 전용 계정'}
            </span>
          )}
        </div>
        {isPending ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState retry={refetch} />
        ) : !rows.length ? (
          <EmptyState
            onReset={() => apply({ search: '', status: 'all', page: 1 })}
          />
        ) : (
          <Table className="min-w-[800px]">
            <TableHeader className="bg-muted/50">
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {editable && (
                    <TableHead className="w-12 pl-5">
                      <Checkbox
                        aria-label="현재 페이지 전체 선택"
                        checked={
                          rows.every((x) => selected.includes(x.id))
                            ? true
                            : rows.some((x) => selected.includes(x.id))
                              ? 'indeterminate'
                              : false
                        }
                        onCheckedChange={(value) =>
                          setSelected(value ? rows.map((x) => x.id) : [])
                        }
                      />
                    </TableHead>
                  )}
                  {group.headers.map((header) => (
                    <TableHead key={header.id} className="h-10 text-xs">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={
                    selected.includes(row.original.id) ? 'selected' : undefined
                  }
                >
                  {editable && (
                    <TableCell className="pl-5">
                      <Checkbox
                        aria-label={`${row.original.title} 선택`}
                        checked={selected.includes(row.original.id)}
                        onCheckedChange={(value) =>
                          setSelected((previous) =>
                            value
                              ? [...previous, row.original.id]
                              : previous.filter((id) => id !== row.original.id),
                          )
                        }
                      />
                    </TableCell>
                  )}
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4 text-xs">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
          <p className="text-xs text-muted-foreground">
            총 {filtered.length}건 · 페이지당 {PAGE_SIZE}건
          </p>
          <nav aria-label="페이지 이동" className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="이전 페이지"
              disabled={page === 1}
              onClick={() => apply({ page: page - 1 })}
            >
              <ChevronLeft />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
              )
              .map((p) => (
                <Button
                  key={p}
                  size="icon"
                  variant={p === page ? 'primary' : 'ghost'}
                  aria-label={`${p}페이지`}
                  aria-current={p === page ? 'page' : undefined}
                  onClick={() => apply({ page: p })}
                >
                  {p}
                </Button>
              ))}
            <Button
              variant="ghost"
              size="icon"
              aria-label="다음 페이지"
              disabled={page === totalPages}
              onClick={() => apply({ page: page + 1 })}
            >
              <ChevronRight />
            </Button>
          </nav>
        </div>
      </div>
      <EntryDetail
        entry={detail}
        editable={editable}
        returnTo={returnTo}
        onClose={() => {
          const next = new URLSearchParams(url);
          next.delete('detail');
          setUrl(next, { replace: true });
        }}
        onCloseFocus={() =>
          (
            detailTrigger.current ?? document.getElementById('main-content')
          )?.focus()
        }
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`${selected.length}개 콘텐츠를 삭제할까요?`}
        description="선택한 예제 콘텐츠가 삭제됩니다. 삭제한 항목은 개발 가이드의 예제 초기화로 복원할 수 있습니다."
        pending={remove.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
