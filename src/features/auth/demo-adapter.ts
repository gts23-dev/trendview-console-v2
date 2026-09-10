import { z } from 'zod';
import type { AuthAdapter, Session } from './model';

const KEY = 'console-boilerplate.demo-session';
const demoSessionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(['admin', 'viewer']),
});

export function readDemoSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const parsed = demoSessionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// 실제 인증이 아닌 로컬 UI 예제. 서비스 연결 시 adapter와 로그인 폼을 함께 교체한다.
export const demoAuthAdapter: AuthAdapter = {
  async getSession() {
    return readDemoSession(sessionStorage.getItem(KEY));
  },
  async signIn(role) {
    const session = {
      id: `demo-${role}`,
      name: role === 'admin' ? '김관리' : '이조회',
      role,
    };
    sessionStorage.setItem(KEY, JSON.stringify(session));
    return session;
  },
  async signOut() {
    sessionStorage.removeItem(KEY);
  },
};
