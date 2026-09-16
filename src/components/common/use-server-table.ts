import { useMemo } from 'react';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';

interface ServerTableOptions<TData> {
  data: TData[];
  columns?: ColumnDef<TData>[];
  /** 서버가 알려 준 전체 개수. 쪽 수는 여기서 계산한다. */
  totalCount: number;
  /** 1부터 세는 쪽 번호. URL의 `page`가 그대로 들어온다. */
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

/**
 * 서버 페이징을 표 인스턴스에 잇는다. 쪽 번호 UI(`DataGridPagination`)가 표
 * 인스턴스에서 상태를 읽으므로, 카드 목록처럼 표가 없는 화면도 이 훅으로
 * 같은 쪽 번호를 쓴다. 그때는 `columns`를 비운다.
 */
export function useServerTable<TData>({
  data,
  columns = [],
  totalCount,
  page,
  pageSize,
  onPageChange,
}: ServerTableOptions<TData>) {
  // 표는 0부터, 화면과 URL은 1부터 센다. 변환은 이 파일에서만 한다.
  const pagination = useMemo(
    () => ({ pageIndex: page - 1, pageSize }),
    [page, pageSize],
  );
  return useReactTable({
    data,
    columns,
    state: { pagination },
    getCoreRowModel: getCoreRowModel(),
    // 한 쪽 분량만 받아 오므로 자르기와 쪽 수 계산을 표에 맡기지 않는다.
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(totalCount / pageSize)),
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(pagination) : updater;
      onPageChange(next.pageIndex + 1);
    },
  });
}
