import { type ReactNode } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { formatCount } from '@/shared/utils/format';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useServerTable } from '@/components/common/use-server-table';

interface DataTableProps<TData extends object> {
  columns: ColumnDef<TData>[];
  data: TData[];
  /** 서버가 알려 준 전체 개수. 쪽 수는 여기서 계산한다. */
  totalCount: number;
  /** 1부터 세는 쪽 번호. URL의 `page`가 그대로 들어온다. */
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  /** 카드 머리 왼쪽. 검색처럼 목록을 좁히는 입력을 둔다. */
  heading?: ReactNode;
  /** 카드 머리 오른쪽. 추가·내보내기처럼 목록에 대한 동작을 둔다. */
  toolbar?: ReactNode;
}

/**
 * 목록 화면이 공통으로 쓰는 표다. Metronic의 목록 조립(Card + DataGrid +
 * CardFooter의 페이지네이션)과 서버 페이징 연동을 여기 한 곳에만 둔다.
 * 화면은 컬럼과 데이터, 머리에 들어갈 조각만 넘긴다.
 *
 * 화면마다 `useReactTable`을 직접 부르면 `manualPagination`과
 * `getPaginationRowModel` 조합이 언젠가 한 화면에서 어긋나고, 그때 증상은
 * 마지막 쪽이 사라지거나 쪽 이동이 멈추는 형태로 나타나 원인을 찾기 어렵다.
 */
export function DataTable<TData extends object>({
  columns,
  data,
  totalCount,
  page,
  pageSize,
  onPageChange,
  isLoading = false,
  emptyMessage = '데이터가 없습니다.',
  heading,
  toolbar,
}: DataTableProps<TData>) {
  const table = useServerTable({
    data,
    columns,
    totalCount,
    page,
    pageSize,
    onPageChange,
  });

  return (
    <DataGrid
      table={table}
      recordCount={totalCount}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      tableLayout={{
        headerBackground: true,
        columnsMovable: false,
        columnsPinnable: false,
        columnsVisibility: false,
        columnsResizable: false,
      }}
    >
      <Card>
        {(heading || toolbar) && (
          <CardHeader>
            <CardHeading>{heading}</CardHeading>
            {toolbar && <CardToolbar>{toolbar}</CardToolbar>}
          </CardHeader>
        )}
        <CardTable>
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        <CardFooter>
          <DataGridPagination
            info={`{from}-{to} / 총 ${formatCount(totalCount)}건`}
          />
        </CardFooter>
      </Card>
    </DataGrid>
  );
}
