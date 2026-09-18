import { RequireAdminGrade } from '@/features/auth';
import { UserSearchView } from '@/features/user-stats';

export function UserSearchPage() {
  return (
    <RequireAdminGrade>
      <UserSearchView />
    </RequireAdminGrade>
  );
}
