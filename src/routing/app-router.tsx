import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
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
