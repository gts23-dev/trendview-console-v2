import { useState, type FormEvent } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { EntryFilters } from '../model/filters';

interface EntryToolbarProps {
  params: EntryFilters;
  onApply: (patch: Partial<EntryFilters>) => void;
}

export function EntryToolbar({ params, onApply }: EntryToolbarProps) {
  const [search, setSearch] = useState(params.search);
  function submit(event: FormEvent) {
    event.preventDefault();
    onApply({ search, page: 1 });
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 p-5">
      <div className="form-field min-w-48 flex-1">
        <label
          htmlFor="entry-search"
          className="text-xs! text-muted-foreground"
        >
          검색어
        </label>
        <div className="relative">
          <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
          <Input
            id="entry-search"
            className="h-10 pl-9"
            placeholder="제목, 콘텐츠 ID, 작성자 검색"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="entry-sort" className="text-xs! text-muted-foreground">
          정렬
        </label>
        <select
          id="entry-sort"
          className="native-select min-w-36"
          value={params.sort}
          onChange={(event) =>
            onApply({
              sort: event.target.value as EntryFilters['sort'],
              page: 1,
            })
          }
        >
          <option value="newest">최근 수정순</option>
          <option value="oldest">오래된 수정순</option>
          <option value="title">제목순</option>
        </select>
      </div>
      <Button type="submit" size="lg">
        검색
      </Button>
      <Button
        type="button"
        variant="outline"
        size="lg"
        aria-label="검색 조건 초기화"
        onClick={() => {
          setSearch('');
          onApply({ search: '', status: 'all', sort: 'newest', page: 1 });
        }}
      >
        <RotateCcw className="size-4" />
      </Button>
    </form>
  );
}
