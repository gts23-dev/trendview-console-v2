import { createContext, useContext } from 'react';
import type { LoginInput, Session } from './model';

export const AuthContext = createContext<{
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (input: LoginInput) => Promise<void>;
  signOut: () => Promise<void>;
} | null>(null);
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider가 필요합니다.');
  return context;
}
