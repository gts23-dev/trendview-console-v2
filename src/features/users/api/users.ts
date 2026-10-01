import { z } from 'zod';
import { request } from '@/shared/api/client';
import { AppError } from '@/shared/errors/app-error';
import { mapUser } from '../model/map-user';
import type {
  AddUserMediaInput,
  CreateUserInput,
  UserListResult,
} from '../model/types';

const userSchema = z.object({
  id: z.number(),
  name: z.string().nullish(),
  email: z.string().nullish(),
  user_media: z
    .array(z.object({ id: z.number(), name: z.string().nullish() }))
    .nullish(),
});

const listSchema = z.object({
  data: z.object({
    data: z.array(userSchema).nullish(),
    userList: z.array(userSchema).nullish(),
  }),
});

/**
 * 쪽 없이 전체를 준다. 검색어는 매체 사용자와 추가 후보를 함께 좁힌다.
 * 기존 콘솔은 c9 헤더 없이 부른다.
 */
export async function getUsers(
  mediaId: number,
  search: string,
  signal?: AbortSignal,
): Promise<UserListResult> {
  const query = new URLSearchParams({ media_id: String(mediaId), search });
  const data = await request<unknown>(`api/v1/users?${query}`, { signal });
  const parsed = listSchema.safeParse(data);
  if (!parsed.success)
    throw new AppError(
      '사용자 목록 응답을 확인하지 못했습니다.',
      'INVALID_RESPONSE',
    );
  return {
    users: (parsed.data.data.data ?? []).map(mapUser),
    candidates: (parsed.data.data.userList ?? []).map(mapUser),
  };
}

/** 새 사용자는 보낸 매체에 속한다. 기존 콘솔의 요청 형태 그대로다. */
export async function createUser({
  mediaId,
  email,
  name,
  password,
  passwordConfirmation,
}: CreateUserInput) {
  await request('api/v1/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      name,
      password,
      password_confirmation: passwordConfirmation,
      media_id: mediaId,
    }),
  });
}

export async function addUserMedia({ userId, mediaId }: AddUserMediaInput) {
  await request('api/v1/users/medias', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, media_id: mediaId }),
  });
}
