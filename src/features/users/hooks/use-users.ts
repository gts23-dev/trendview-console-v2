import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addUserMedia, createUser, getUsers } from '../api/users';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  // 쪽은 화면에서 나누므로 key에 넣지 않는다.
  list: (mediaId: number, search: string) =>
    [...userKeys.lists(), mediaId, search] as const,
};

export function useUserList(mediaId: number | null, search: string) {
  return useQuery({
    queryKey: userKeys.list(mediaId ?? 0, search),
    queryFn: ({ signal }) => getUsers(mediaId!, search, signal),
    enabled: mediaId !== null,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    // 입력값에 비밀번호가 있다. 끝난 요청을 캐시에 남기지 않는다(기본 5분).
    // 화면에서도 끝나면 reset()으로 지운다.
    gcTime: 0,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}

export function useAddUserMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addUserMedia,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}
