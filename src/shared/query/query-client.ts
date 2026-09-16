import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError, AppError, getErrorMessage } from '@/shared/errors/app-error';

function logRequestError(message: string, error: unknown) {
  console.error(
    message,
    error instanceof AppError ? error.code : 'UNEXPECTED_ERROR',
    error instanceof ApiError ? error.status : '',
  );
}

export function createAppQueryClient(
  // 전역 mutation 실패 알림을 주입하는 구현 지점이다.
  // eslint-disable-next-line project/error-toast
  notifyError: (message: string) => void = toast.error,
) {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => logRequestError('데이터 조회 실패', error),
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        logRequestError('데이터 변경 실패', error);
        notifyError(getErrorMessage(error));
      },
    }),
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}

export const queryClient = createAppQueryClient();
