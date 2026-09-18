import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from '@/features/auth';
import { EmptyState } from '@/components/common/empty-state';
import { AppLayout } from '@/components/layouts/app-layout';
import { LoginPage } from '@/pages/login/page';

// 화면을 붙일 때 `config/menu.config.ts`에도 같은 경로를 한 줄 추가한다.
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
            path: 'settings/topics',
            lazy: () =>
              import('@/pages/settings/topics/page').then((m) => ({
                Component: m.TopicsPage,
              })),
          },
          {
            path: 'stats/counts',
            lazy: () =>
              import('@/pages/stats/counts/page').then((m) => ({
                Component: m.CountsPage,
              })),
          },
          {
            path: 'stats/users',
            lazy: () =>
              import('@/pages/stats/users/page').then((m) => ({
                Component: m.UsersStatsPage,
              })),
          },
          {
            path: 'stats/contents',
            lazy: () =>
              import('@/pages/stats/contents/page').then((m) => ({
                Component: m.ContentsPage,
              })),
          },
          {
            path: 'stats/tags',
            lazy: () =>
              import('@/pages/stats/tags/page').then((m) => ({
                Component: m.TagsPage,
              })),
          },
          {
            path: 'stats/visitors',
            lazy: () =>
              import('@/pages/stats/visitors/page').then((m) => ({
                Component: m.VisitorsPage,
              })),
          },
          {
            path: 'stats/user-search',
            lazy: () =>
              import('@/pages/stats/user-search/page').then((m) => ({
                Component: m.UserSearchPage,
              })),
          },
          {
            path: 'stats/user-logs',
            lazy: () =>
              import('@/pages/stats/user-logs/page').then((m) => ({
                Component: m.UserLogsPage,
              })),
          },
          {
            path: 'stats/tag-totals',
            lazy: () =>
              import('@/pages/stats/tag-totals/page').then((m) => ({
                Component: m.TagTotalsPage,
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
