import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from '@/features/auth';
import { EmptyState } from '@/components/common/empty-state';
import { AppLayout } from '@/components/layouts/app-layout';
import { LoginPage } from '@/pages/login/page';

const DashboardPage = lazy(() =>
  import('@/pages/dashboard/page').then((m) => ({ default: m.DashboardPage })),
);
const EntriesPage = lazy(() =>
  import('@/pages/entries/page').then((m) => ({ default: m.EntriesPage })),
);
const EntryFormPage = lazy(() =>
  import('@/pages/entries/form/page').then((m) => ({
    default: m.EntryFormPage,
  })),
);
const ComponentsPage = lazy(() =>
  import('@/pages/components/page').then((m) => ({
    default: m.ComponentsPage,
  })),
);
const GuidePage = lazy(() =>
  import('@/pages/guide/page').then((m) => ({ default: m.GuidePage })),
);
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'entries', element: <EntriesPage /> },
          { path: 'entries/new', element: <EntryFormPage /> },
          { path: 'entries/:id/edit', element: <EntryFormPage /> },
          { path: 'components', element: <ComponentsPage /> },
          { path: 'guide', element: <GuidePage /> },
          {
            path: '*',
            element: (
              <div>
                <EmptyState
                  title="페이지를 찾을 수 없습니다"
                  description="주소를 확인하거나 메뉴에서 화면을 선택해 주세요."
                />
                <p className="pb-8 text-center">
                  <a href="/dashboard" className="text-primary underline">
                    대시보드로 돌아가기
                  </a>
                </p>
              </div>
            ),
          },
        ],
      },
    ],
  },
]);
