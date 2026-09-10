export interface Session {
  id: string;
  name: string;
  role: 'admin' | 'viewer';
}

export interface AuthAdapter {
  getSession(): Promise<Session | null>;
  signIn(role: Session['role']): Promise<Session>;
  signOut(): Promise<void>;
}
export function canEdit(session: Session | null) {
  return session?.role === 'admin';
}
