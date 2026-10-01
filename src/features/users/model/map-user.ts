import type { User } from './types';

export interface UserData {
  id: number;
  name?: string | null;
  email?: string | null;
  user_media?: { id: number; name?: string | null }[] | null;
}

/** 등급·접속 IP 같은 나머지 필드는 화면에 쓰지 않아 버린다. */
export function mapUser(data: UserData): User {
  return {
    id: data.id,
    name: data.name ?? '',
    email: data.email ?? '',
    medias: (data.user_media ?? []).map((media) => ({
      id: media.id,
      name: media.name ?? '',
    })),
  };
}
