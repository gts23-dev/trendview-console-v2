import { RequireAdminGrade } from '@/features/auth';
import { UserLogListView } from '@/features/user-logs';

export function UserLogsPage() {
  return (
    <RequireAdminGrade>
      <UserLogListView />
    </RequireAdminGrade>
  );
}
