import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MENU_GROUPS } from '@/config/menu.config';
import { RequireAuth } from '@/features/auth';
import { EmptyState } from '@/components/common/empty-state';
import { AppLayout } from '@/components/layouts/app-layout';
import { LoginPage } from '@/pages/login/page';

const CollectPage = lazy(() =>
  import('@/pages/collect/page').then((m) => ({ default: m.CollectPage })),
);
const ArticlesPage = lazy(() =>
  import('@/pages/articles/page').then((m) => ({ default: m.ArticlesPage })),
);

/** 실제 화면이 붙은 경로. 나머지는 아직 준비 중 안내를 보여준다. */
const BUILT_PATHS = new Set(['/collect', '/articles']);

// 각 화면은 Phase 1~4에서 순서대로 실제 page로 교체한다.
function comingSoon(label: string) {
  return (
    <EmptyState
      title={label}
      description="이 화면은 아직 만들지 않았습니다. 이관 계획의 다음 단계에서 연결됩니다."
    />
  );
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/collect" replace /> },
          { path: 'collect', element: <CollectPage /> },
          { path: 'articles', element: <ArticlesPage /> },
          ...MENU_GROUPS.flatMap((group) =>
            group.items
              .filter((item) => !BUILT_PATHS.has(item.path))
              .map((item) => ({
                path: item.path.slice(1),
                element: comingSoon(item.label),
              })),
          ),
          {
            path: '*',
            element: (
              <EmptyState
                title="페이지를 찾을 수 없습니다"
                description="주소를 확인하거나 메뉴에서 화면을 선택해 주세요."
              />
            ),
          },
        ],
      },
    ],
  },
]);
