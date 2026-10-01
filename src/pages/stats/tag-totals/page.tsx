import { RequireAdminGrade } from '@/features/auth';
import { TagTotalListView } from '@/features/tags';

export function TagTotalsPage() {
  return (
    <RequireAdminGrade>
      <TagTotalListView />
    </RequireAdminGrade>
  );
}
