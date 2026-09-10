import { AlertCircle, LoaderCircle, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
}

export function EmptyState({
  title = '검색 결과가 없습니다',
  description = '다른 검색어를 입력하거나 조건을 초기화해 주세요.',
  onReset,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
      <span className="mb-4 rounded-full bg-muted p-4">
        <SearchX className="size-6 text-muted-foreground" />
      </span>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {onReset && (
        <Button className="mt-5" variant="outline" onClick={onReset}>
          조건 초기화
        </Button>
      )}
    </div>
  );
}
export function LoadingState() {
  return (
    <div
      role="status"
      className="flex min-h-64 items-center justify-center gap-2 text-muted-foreground"
    >
      <LoaderCircle className="size-5 animate-spin" />
      불러오는 중...
    </div>
  );
}
interface ErrorStateProps {
  retry: () => void;
}

export function ErrorState({ retry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex min-h-64 flex-col items-center justify-center gap-4"
    >
      <AlertCircle className="size-7 text-destructive" />
      <p>데이터를 불러오지 못했습니다.</p>
      <Button variant="outline" onClick={retry}>
        다시 시도
      </Button>
    </div>
  );
}
