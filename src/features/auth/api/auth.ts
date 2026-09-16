import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';
import type { LoginInput, Session } from '../model';

const tokenSchema = z.object({ access_token: z.string().min(1) });

// 응답에서 화면이 쓰는 필드만 검증한다. 기존 콘솔이 `?? 0`이나 옵셔널 접근으로
// 감싸던 필드는 없을 수 있다고 보고 optional로 둔다.
const meSchema = z.object({
  data: z.object({
    id: z.union([z.number(), z.string()]),
    name: z.string(),
    email: z.string().optional(),
    grade: z.number().nullish(),
    user_media: z
      .array(z.object({ id: z.number(), name: z.string() }))
      .nullish(),
  }),
});

/**
 * oauth password grant. 기존 콘솔과 동일하게 JSON body로 보낸다. client 값은
 * 번들에 포함되어 브라우저에 공개된다.
 */
export async function requestToken(input: LoginInput) {
  const data = await request<unknown>('oauth/token', {
    method: 'POST',
    body: JSON.stringify({
      grant_type: 'password',
      username: input.username,
      password: input.password,
      client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
      client_secret: import.meta.env.VITE_OAUTH_CLIENT_SECRET,
      scope: '*',
    }),
  });
  const parsed = tokenSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('아이디 또는 비밀번호를 확인해 주세요.', 'LOGIN_FAILED');
  return parsed.data.access_token;
}

export async function getMe(): Promise<Session> {
  const data = await request<unknown>('api/v1/me');
  const parsed = meSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError('로그인 정보를 확인하지 못했습니다.', 'INVALID_SESSION');
  const me = parsed.data.data;
  return {
    id: String(me.id),
    name: me.name,
    email: me.email ?? '',
    grade: me.grade ?? 0,
    medias: me.user_media ?? [],
  };
}
