import { RequireAdminGrade } from '@/features/auth';
import { TagRankView } from '@/features/tags';

export function TagsPage() {
  return (
    <RequireAdminGrade>
      <TagRankView />
    </RequireAdminGrade>
  );
}
