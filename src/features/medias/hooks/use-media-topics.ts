import { useQuery } from '@tanstack/react-query';
import { getMediaTopics } from '../api/medias';

export function useMediaTopics(mediaId: number | null) {
  return useQuery({
    queryKey: ['medias', mediaId ?? 0, 'topics'],
    queryFn: ({ signal }) => getMediaTopics(mediaId!, signal),
    enabled: mediaId !== null,
  });
}
