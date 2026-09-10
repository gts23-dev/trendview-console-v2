import { Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { EmptyState, LoadingState } from '@/components/common/empty-state';
import { useAuth } from './context';

export function RequireAuth() {
  const { session, loading, error } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingState />;
  if (error)
    return (
      <EmptyState title="세션을 확인하지 못했습니다" description={error} />
    );
  return session ? (
    <Suspense fallback={<LoadingState />}>
      <Outlet />
    </Suspense>
  ) : (
    <Navigate
      to="/login"
      state={{ from: location.pathname + location.search }}
      replace
    />
  );
}
