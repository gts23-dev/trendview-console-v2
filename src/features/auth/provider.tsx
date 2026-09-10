import { useEffect, useState, type PropsWithChildren } from 'react';
import { queryClient } from '@/shared/query/query-client';
import { authAdapter } from './adapter';
import { AuthContext } from './context';
import type { Session } from './model';

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    authAdapter
      .getSession()
      .then((value) => {
        if (mounted) setSession(value);
      })
      .catch(() => {
        if (mounted) setError('브라우저 저장소에 접근하지 못했습니다.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
  async function signIn(role: Session['role']) {
    queryClient.clear();
    setSession(await authAdapter.signIn(role));
  }
  async function signOut() {
    await authAdapter.signOut();
    queryClient.clear();
    setSession(null);
  }
  return (
    <AuthContext.Provider value={{ session, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
