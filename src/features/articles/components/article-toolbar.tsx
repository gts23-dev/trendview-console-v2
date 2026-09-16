import { useEffect, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { cn } from '@/shared/utils/class-name';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateRangeField } from '@/components/common/date-range-field';
import type { ArticleFilters } from '../model/filters';
import { getPlatformLabel, PLATFORM_FILTERS } from '../model/platforms';

interface ArticleToolbarProps {
  filters: ArticleFilters;
  onChange: (filters: Partial<ArticleFilters>) => void;
  onReset: () => void;
}

export function ArticleToolbar({
  filters,
  onChange,
  onReset,
}: ArticleToolbarProps) {
  // 검색어는 Enter나 버튼으로 확정할 때까지 입력 중 상태로 둔다.
  const [search, setSearch] = useState(filters.search);
  useEffect(() => setSearch(filters.search), [filters.search]);

  const allPlatforms = filters.platforms.length === 0;
  function togglePlatform(platform: string) {
    const next = filters.platforms.includes(platform)
      ? filters.platforms.filter((value) => value !== platform)
      : [...filters.platforms, platform];
    // 전부 고르면 조건이 없는 것과 같으므로 URL에서 지운다.
    onChange({
      platforms: next.length === PLATFORM_FILTERS.length ? [] : next,
    });
  }

  const hasCondition =
    !allPlatforms ||
    !!filters.search ||
    !!filters.startDate ||
    !!filters.endDate ||
    filters.sort !== 'sort_id';

  return (
    // 왼쪽은 목록을 줄이는 조건(플랫폼·기간), 오른쪽은 자유 입력인 검색이다.
    // 기간까지 오른쪽으로 보내면 같은 종류가 양 끝으로 갈라진다.
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b pb-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant={allPlatforms ? 'primary' : 'outline'}
          aria-pressed={allPlatforms}
          onClick={() => onChange({ platforms: [] })}
        >
          전체
        </Button>
        {PLATFORM_FILTERS.map((platform) => {
          const active = allPlatforms || filters.platforms.includes(platform);
          return (
            <Button
              key={platform}
              type="button"
              size="sm"
              variant={
                !allPlatforms && filters.platforms.includes(platform)
                  ? 'primary'
                  : 'outline'
              }
              aria-pressed={active}
              className={cn(allPlatforms && 'text-muted-foreground')}
              onClick={() => togglePlatform(platform)}
            >
              {getPlatformLabel(platform)}
            </Button>
          );
        })}
      </div>
      <DateRangeField
        startDate={filters.startDate}
        endDate={filters.endDate}
        onChange={(startDate, endDate) => onChange({ startDate, endDate })}
      />
      <form
        className="flex items-center gap-1.5 sm:ms-auto"
        onSubmit={(event) => {
          event.preventDefault();
          onChange({ search });
        }}
      >
        <Input
          type="search"
          className="w-[200px]"
          placeholder="제목, 내용 검색"
          aria-label="검색어"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button type="submit" variant="outline" size="sm">
          <Search className="size-4" />
          검색
        </Button>
      </form>
      {hasCondition && (
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="size-4" />
          조건 초기화
        </Button>
      )}
    </div>
  );
}
