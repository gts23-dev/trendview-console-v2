import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChunkPaginationProps {
  page: number;
  totalPages: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

/** `useChunkPager`가 계산한 쪽 상태를 보여주는 이전/다음 구간 버튼. */
export function ChunkPagination({
  page,
  totalPages,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: ChunkPaginationProps) {
  return (
    <div className="flex items-center justify-end gap-3">
      <span className="text-xs text-muted-foreground">
        현재 페이지 : {page} / 전체 페이지 : {totalPages}
      </span>
      <Button
        type="button"
        size="icon"
        shape="circle"
        variant="outline"
        aria-label="이전 구간"
        disabled={!canGoPrev}
        onClick={onPrev}
      >
        <ChevronLeft />
      </Button>
      <Button
        type="button"
        size="icon"
        shape="circle"
        variant="outline"
        aria-label="다음 구간"
        disabled={!canGoNext}
        onClick={onNext}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
