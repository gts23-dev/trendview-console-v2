import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from '@/features/auth';
import { EmptyState } from '@/components/common/empty-state';
import { AppLayout } from '@/components/layouts/app-layout';
import { LoginPage } from '@/pages/login/page';

// 화면은 라우트 단위로 나눠 받는다. 메뉴에도 같은 경로를 한 줄 추가한다.
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/collect" replace /> },
          {
            path: 'collect',
            lazy: () =>
              import('@/pages/collect/page').then((m) => ({
                Component: m.CollectPage,
              })),
          },
          {
            path: 'articles',
            lazy: () =>
              import('@/pages/articles/page').then((m) => ({
                Component: m.ArticlesPage,
              })),
          },
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
