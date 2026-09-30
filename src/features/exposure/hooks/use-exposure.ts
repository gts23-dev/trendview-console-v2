import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getExposureGrade,
  getExposureWeight,
  saveExposureGrade,
  saveExposureWeight,
} from '../api/exposure';

export const exposureKeys = {
  all: ['exposure'] as const,
  weight: (mediaId: number) =>
    [...exposureKeys.all, 'weight', mediaId] as const,
  grade: (mediaId: number) => [...exposureKeys.all, 'grade', mediaId] as const,
};

export function useExposureWeight(mediaId: number | null) {
  return useQuery({
    queryKey: exposureKeys.weight(mediaId ?? 0),
    queryFn: ({ signal }) => getExposureWeight(mediaId!, signal),
    enabled: mediaId !== null,
  });
}

export function useExposureGrade(mediaId: number | null) {
  return useQuery({
    queryKey: exposureKeys.grade(mediaId ?? 0),
    queryFn: ({ signal }) => getExposureGrade(mediaId!, signal),
    enabled: mediaId !== null,
  });
}

// 저장이 끝나면 보낸 값으로 먼저 바꾸고, 다시 받아 서버에 실제로 남은 값으로
// 맞춘다. 다시 받기가 실패해도 화면에는 보낸 값이 남는다. 다시 받을 때까지
// 저장 중으로 두어 그사이 입력을 막는다.
export function useSaveExposureWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveExposureWeight,
    onSuccess: (_, { mediaId, ...weight }) => {
      queryClient.setQueryData(exposureKeys.weight(mediaId), weight);
      return queryClient.invalidateQueries({
        queryKey: exposureKeys.weight(mediaId),
      });
    },
  });
}

export function useSaveExposureGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveExposureGrade,
    onSuccess: (_, { mediaId, ...grade }) => {
      queryClient.setQueryData(exposureKeys.grade(mediaId), grade);
      return queryClient.invalidateQueries({
        queryKey: exposureKeys.grade(mediaId),
      });
    },
  });
}
