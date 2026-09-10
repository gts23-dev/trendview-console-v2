import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import {
  deleteEntries,
  getEntries,
  resetEntries,
  saveEntry,
} from '../api/entries';
import type { EntryInput } from '../model/types';

export const entryKeys = {
  all: ['entries'] as const,
  lists: () => [...entryKeys.all, 'list'] as const,
  list: (sessionId: string | undefined) =>
    [...entryKeys.lists(), { sessionId }] as const,
};

export function useEntryList() {
  const { session } = useAuth();
  return useQuery({
    queryKey: entryKeys.list(session?.id),
    queryFn: getEntries,
    enabled: !!session,
  });
}

export function useSaveEntry(id?: string) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EntryInput) => saveEntry(input, session, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: entryKeys.all }),
  });
}

export function useDeleteEntries() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteEntries(ids, session),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: entryKeys.all }),
  });
}

export function useResetEntries() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => resetEntries(session),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: entryKeys.all }),
  });
}
