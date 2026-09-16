import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { shiftDate, today } from '@/shared/utils/format';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangeFieldProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

/** 자주 쓰는 기간. 라벨이 가리키는 기간과 정확히 같아야 한다. */
const PRESETS: { label: string; range: () => [string, string] }[] = [
  { label: '전체', range: () => ['', ''] },
  { label: '오늘', range: () => [today(), today()] },
  // 어제 하루다. 오늘까지 포함하면 라벨과 어긋난다.
  { label: '어제', range: () => [shiftDate(1), shiftDate(1)] },
  // 오늘을 포함한 7일이다.
  { label: '일주일', range: () => [shiftDate(6), today()] },
  { label: '한 달', range: () => [shiftDate(29), today()] },
];

/** `YYYY-MM-DD`를 로컬 자정으로 읽는다. `new Date(문자열)`은 UTC로 해석한다. */
function toDate(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toValue(date: Date | undefined) {
  return date ? shiftDate(0, date) : '';
}

export function DateRangeField({
  startDate,
  endDate,
  onChange,
}: DateRangeFieldProps) {
  const [open, setOpen] = useState(false);
  const selected: DateRange | undefined = startDate
    ? { from: toDate(startDate), to: toDate(endDate) }
    : undefined;
  const activePreset = PRESETS.find((preset) => {
    const [start, end] = preset.range();
    return startDate === start && endDate === end;
  });
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button mode="input" variant="outline" className="justify-start">
          <CalendarDays />
          {startDate
            ? `${startDate} ~ ${endDate || '…'}`
            : activePreset && activePreset.label !== '전체'
              ? activePreset.label
              : '전체 기간'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col sm:flex-row">
          <div className="flex gap-1 border-b p-2 sm:flex-col sm:border-r sm:border-b-0">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                size="sm"
                variant={activePreset === preset ? 'primary' : 'ghost'}
                className="justify-start"
                onClick={() => {
                  onChange(...preset.range());
                  setOpen(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Calendar
            autoFocus
            mode="range"
            numberOfMonths={2}
            defaultMonth={toDate(startDate) ?? new Date()}
            selected={selected}
            disabled={{ after: new Date() }}
            onSelect={(range) => {
              const from = toValue(range?.from);
              // 시작만 고른 중간 상태에서는 종료일을 비워 둔다. 두 번째 클릭에서
              // 채워진다. 한쪽만 남은 채 닫히면 그날 하루로 본다.
              onChange(from, toValue(range?.to) || from);
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
