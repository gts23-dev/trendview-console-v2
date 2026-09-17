import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTopics, saveTopic } from '../api/topics';
import type { TopicFilters } from '../model/filters';

export const topicKeys = {
  all: ['topics'] as const,
  lists: () => [...topicKeys.all, 'list'] as const,
  // 매체는 응답을 바꾸는 조건이므로 반드시 key에 포함한다.
  list: (mediaId: number, filters: TopicFilters) =>
    [...topicKeys.lists(), mediaId, filters] as const,
};

export function useTopicList(mediaId: number | null, filters: TopicFilters) {
  return useQuery({
    queryKey: topicKeys.list(mediaId ?? 0, filters),
    queryFn: ({ signal }) => getTopics(filters, mediaId!, signal),
    enabled: mediaId !== null,
  });
}

export function useSaveTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveTopic,
    // 이름을 바꾸면 번호와 순서가 달라질 수 있어 목록 전체를 다시 받는다.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: topicKeys.lists() }),
  });
}
