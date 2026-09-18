import { useQuery } from '@tanstack/react-query';
import {
  getPlatformPageViewStats,
  getUserPageViewStats,
  getUvPvStats,
} from '../api/uv-pv';
import type { UvPvFilters } from '../model/uv-pv';

export const uvPvKeys = {
  all: ['uv-pv'] as const,
  uvPv: (mediaId: number, filters: UvPvFilters) =>
    [...uvPvKeys.all, 'uv-pv-stats', mediaId, filters] as const,
  userPv: (mediaId: number, filters: UvPvFilters) =>
    [...uvPvKeys.all, 'user-pv', mediaId, filters] as const,
  platformPv: (mediaId: number, filters: UvPvFilters) =>
    [...uvPvKeys.all, 'platform-pv', mediaId, filters] as const,
};

export function useUvPvStats(mediaId: number | null, filters: UvPvFilters) {
  return useQuery({
    queryKey: uvPvKeys.uvPv(mediaId ?? 0, filters),
    queryFn: ({ signal }) => getUvPvStats(filters, mediaId!, signal),
    enabled: mediaId !== null,
  });
}

export function useUserPageViewStats(
  mediaId: number | null,
  filters: UvPvFilters,
) {
  return useQuery({
    queryKey: uvPvKeys.userPv(mediaId ?? 0, filters),
    queryFn: ({ signal }) => getUserPageViewStats(filters, mediaId!, signal),
    enabled: mediaId !== null,
  });
}

export function usePlatformPageViewStats(
  mediaId: number | null,
  filters: UvPvFilters,
) {
  return useQuery({
    queryKey: uvPvKeys.platformPv(mediaId ?? 0, filters),
    queryFn: ({ signal }) =>
      getPlatformPageViewStats(filters, mediaId!, signal),
    enabled: mediaId !== null,
  });
}
