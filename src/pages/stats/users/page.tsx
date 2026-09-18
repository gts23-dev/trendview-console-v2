import { RequireAdminGrade } from '@/features/auth';
import { UvPvView } from '@/features/user-stats';

export function UsersStatsPage() {
  return (
    <RequireAdminGrade>
      <UvPvView />
    </RequireAdminGrade>
  );
}
