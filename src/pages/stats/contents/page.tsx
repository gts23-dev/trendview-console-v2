import { ContentRanksView } from '@/features/article-stats';
import { RequireAdminGrade } from '@/features/auth';

export function ContentsPage() {
  return (
    <RequireAdminGrade>
      <ContentRanksView />
    </RequireAdminGrade>
  );
}
