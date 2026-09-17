import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/shared/utils/class-name';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchFieldProps {
  /** 확정된 검색어. URL에서 온다. */
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** 목록 위 검색 입력. Enter로 확정할 때까지는 입력 중 상태로 둔다. */
export function SearchField({
  value,
  onSearch,
  placeholder = '검색',
  className,
}: SearchFieldProps) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <form
      className={cn('relative', className)}
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(draft.trim());
      }}
    >
      <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={draft}
        placeholder={placeholder}
        className="w-48 ps-9"
        onChange={(event) => setDraft(event.target.value)}
      />
      {draft.length > 0 && (
        <Button
          type="button"
          mode="icon"
          variant="ghost"
          aria-label="검색어 지우기"
          className="absolute end-1.5 top-1/2 size-6 -translate-y-1/2"
          onClick={() => {
            setDraft('');
            onSearch('');
          }}
        >
          <X />
        </Button>
      )}
    </form>
  );
}
