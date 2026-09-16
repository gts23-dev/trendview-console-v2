import {
  clearAccessToken,
  readAccessToken,
  writeAccessToken,
} from '@/shared/api/access-token';
import { getMe, requestToken } from './api/auth';
import type { AuthAdapter } from './model';

export const httpAuthAdapter: AuthAdapter = {
  async getSession() {
    if (!readAccessToken()) return null;
    try {
      return await getMe();
    } catch {
      // 만료되거나 잘못된 토큰은 버리고 로그인 화면으로 보낸다.
      clearAccessToken();
      return null;
    }
  },
  async signIn(input) {
    writeAccessToken(await requestToken(input));
    try {
      return await getMe();
    } catch (error) {
      clearAccessToken();
      throw error;
    }
  },
  async signOut() {
    clearAccessToken();
  },
};
