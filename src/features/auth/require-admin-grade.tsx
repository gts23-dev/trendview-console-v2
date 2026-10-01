import type { ReactNode } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import { useAuth } from './context';
import { isAdminGrade } from './model';

interface RequireAdminGradeProps {
  children: ReactNode;
}

/**
 * 통계처럼 등급 0(운영자)에게 숨기는 화면을 감싼다. 메뉴 숨김은 표시 제어일
 * 뿐이고 주소를 직접 입력하면 그대로 열렸다. 실제 인가는 서버가 하며, 이건
 * 화면 표시를 메뉴와 일치시키는 보완이다.
 */
export function RequireAdminGrade({ children }: RequireAdminGradeProps) {
  const { session } = useAuth();
  if (!isAdminGrade(session)) {
    return (
      <div className="px-5 py-6 sm:px-8 lg:px-10">
        <EmptyState
          title="접근 권한이 없습니다"
          description="이 화면은 관리자만 사용할 수 있습니다."
        />
      </div>
    );
  }
  return <>{children}</>;
}
