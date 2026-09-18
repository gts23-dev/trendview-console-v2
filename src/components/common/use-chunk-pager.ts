import { useMemo } from 'react';

interface ChunkPagerOptions {
  /** 1부터 세는 현재 쪽. 범위를 벗어나면 안쪽으로 보정한다. */
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

/**
 * 서버가 기간 전체를 한 번에 내려주고 화면에서 몇 개씩 끊어 보여주는 화면들이
 * 쓰는 훅이다(예: 콘텐츠 순위, 사용자별 PV). 서버 페이징이 아니라 이미 받은
 * 배열을 자르는 것뿐이라 쪽 번호는 URL이 아니라 화면 상태로 둔다.
 */
export function useChunkPager<TItem>(
  items: TItem[],
  { page, pageSize, onPageChange }: ChunkPagerOptions,
) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );
  return {
    pageItems,
    /** 현재 쪽 첫 항목의 전체 배열 기준 인덱스. 같은 라벨이 중복될 수 있는
     * 항목의 React key로 라벨 대신 이 값을 쓴다(구간 값이 서버 응답에서
     * 중복되는 경우가 실제로 있었음). */
    pageStartIndex: (safePage - 1) * pageSize,
    page: safePage,
    totalPages,
    canGoPrev: safePage > 1,
    canGoNext: safePage < totalPages,
    goPrev: () => onPageChange(Math.max(1, safePage - 1)),
    goNext: () => onPageChange(Math.min(totalPages, safePage + 1)),
  };
}
