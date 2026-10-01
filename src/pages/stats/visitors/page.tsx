import { RequireAdminGrade } from '@/features/auth';
import { VisitorRankList } from '@/features/user-stats';

export function VisitorsPage() {
  return (
    <RequireAdminGrade>
      <VisitorRankList />
    </RequireAdminGrade>
  );
}
