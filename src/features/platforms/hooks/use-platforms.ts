import { useQuery } from '@tanstack/react-query';
import { getActivePlatforms } from '../api/platforms';

export const platformKeys = {
  all: ['platforms'] as const,
  active: () => [...platformKeys.all, 'active'] as const,
};

export function useActivePlatforms() {
  return useQuery({
    queryKey: platformKeys.active(),
    queryFn: ({ signal }) => getActivePlatforms(signal),
    // 매체와 무관하고 거의 바뀌지 않는다.
    staleTime: 10 * 60 * 1000,
  });
}
