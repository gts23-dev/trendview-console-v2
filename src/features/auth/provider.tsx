import { useEffect, useState, type PropsWithChildren } from 'react';
import { UNAUTHORIZED_EVENT } from '@/shared/api/client';
import { queryClient } from '@/shared/query/query-client';
import { authAdapter } from './adapter';
import { AuthContext } from './context';
import type { LoginInput, Session } from './model';

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
        if (mounted) setError('로그인 상태를 확인하지 못했습니다.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
  // 토큰 만료는 요청 계층에서 알려주고 세션 정리는 이 한 곳에서만 한다.
  useEffect(() => {
    function handleUnauthorized() {
      queryClient.clear();
      setSession(null);
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () =>
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);
  async function signIn(input: LoginInput) {
    queryClient.clear();
    setSession(await authAdapter.signIn(input));
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
