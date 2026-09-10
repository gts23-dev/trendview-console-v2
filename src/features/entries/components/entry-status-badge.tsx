import { cn } from '@/shared/utils/class-name';
import { STATUS_LABELS } from '../model/display';
import type { Entry } from '../model/types';

interface EntryStatusBadgeProps {
  status: Entry['status'];
}

export function EntryStatusBadge({ status }: EntryStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap',
        status === 'published'
          ? 'bg-success-soft text-success'
          : status === 'draft'
            ? 'bg-warning-soft text-warning'
            : 'bg-secondary text-muted-foreground',
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}
