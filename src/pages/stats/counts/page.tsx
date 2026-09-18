import { CountsView } from '@/features/article-stats';
import { RequireAdminGrade } from '@/features/auth';

export function CountsPage() {
  return (
    <RequireAdminGrade>
      <CountsView />
    </RequireAdminGrade>
  );
}
