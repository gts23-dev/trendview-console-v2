import { useEffect, useState } from 'react';
import { getPlatformLabel, PLATFORM_FILTERS } from '@/features/articles';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRangeField } from '@/components/common/date-range-field';
import { EVENT_FILTERS, type UserLogFilters } from '../model/filters';
import { getEventLabel } from '../model/map-log';
import { TagFilterInput } from './tag-filter-input';

const ALL = '__all__';

interface UserLogToolbarProps {
  filters: UserLogFilters;
  onChange: (filters: Partial<UserLogFilters>) => void;
}

export function UserLogToolbar({ filters, onChange }: UserLogToolbarProps) {
  const [articleId, setArticleId] = useState(filters.articleId);
  useEffect(() => setArticleId(filters.articleId), [filters.articleId]);
  const [userId, setUserId] = useState(filters.userId);
  useEffect(() => setUserId(filters.userId), [filters.userId]);

  return (
    <div className="space-y-3">
      {/* 고르면 바로 적용되는 조건들. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          value={filters.platform || ALL}
          onValueChange={(value) =>
            onChange({ platform: value === ALL ? '' : value })
          }
        >
          <SelectTrigger aria-label="플랫폼">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>전체 플랫폼</SelectItem>
            {PLATFORM_FILTERS.map((platform) => (
              <SelectItem key={platform} value={platform}>
                {getPlatformLabel(platform)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.event || ALL}
          onValueChange={(value) =>
            onChange({
              event: value === ALL ? '' : (value as typeof filters.event),
            })
          }
        >
          <SelectTrigger aria-label="행동">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>전체 행동</SelectItem>
            {EVENT_FILTERS.map((event) => (
              <SelectItem key={event} value={event}>
                {getEventLabel(event)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DateRangeField
          startDate={filters.startDate}
          endDate={filters.endDate}
          onChange={(startDate, endDate) => onChange({ startDate, endDate })}
        />

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={filters.without}
            onCheckedChange={(value) => onChange({ without: value === true })}
          />
          제외사용자 미포함
        </label>
      </div>

      {/* 직접 입력하고 "검색"을 눌러야(또는 엔터) 적용되는 조건들. 버튼을
          바로 옆에 둬야 무엇을 확정하는 버튼인지 헷갈리지 않는다. */}
      <div className="flex flex-wrap items-center gap-3">
        <form
          className="w-[200px]"
          onSubmit={(event) => {
            event.preventDefault();
            onChange({ articleId });
          }}
        >
          <Input
            placeholder="글번호 검색"
            value={articleId}
            onChange={(event) => setArticleId(event.target.value)}
          />
        </form>

        <form
          className="w-[200px]"
          onSubmit={(event) => {
            event.preventDefault();
            onChange({ userId });
          }}
        >
          <Input
            placeholder="유저 검색"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />
        </form>

        <div className="min-w-[220px] flex-1">
          <TagFilterInput
            tags={filters.tags}
            onChange={(tags) => onChange({ tags })}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => onChange({ articleId, userId })}
        >
          검색
        </Button>
      </div>
    </div>
  );
}
