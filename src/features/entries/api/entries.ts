import { z } from 'zod';
import { AppError } from '@/shared/errors/app-error';
import { canEdit, type Session } from '@/features/auth';
import { INITIAL_ENTRIES } from '../mocks/entries';
import { entryInputSchema } from '../model/schema';
import type { Entry, EntryInput } from '../model/types';

const STORAGE_KEY = 'console-boilerplate.entries.v1';
const storedEntriesSchema = z.array(
  entryInputSchema.extend({
    id: z.string(),
    author: z.string(),
    updatedAt: z.string().datetime({ offset: true }),
  }),
);

function readEntries(): Entry[] {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(INITIAL_ENTRIES);
  try {
    return storedEntriesSchema.parse(JSON.parse(raw));
  } catch {
    throw new AppError(
      '저장된 예제 데이터를 읽을 수 없습니다. 개발 가이드에서 초기화해 주세요.',
      'INVALID_DEMO_DATA',
    );
  }
}

function writeEntries(entries: Entry[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function requireEditor(session: Session | null): asserts session is Session {
  if (!canEdit(session))
    throw new AppError('수정 권한이 없습니다.', 'FORBIDDEN');
}

// 데모 전용 저장 구현. 실제 연결 시 이 함수들의 내부를 HTTP 요청으로 교체한다.
export async function getEntries(): Promise<Entry[]> {
  return readEntries();
}

export async function saveEntry(
  input: EntryInput,
  session: Session | null,
  id?: string,
): Promise<Entry> {
  requireEditor(session);
  const parsed = entryInputSchema.safeParse(input);
  if (!parsed.success)
    throw new AppError('입력 내용을 확인해 주세요.', 'INVALID_INPUT');
  const entries = readEntries();
  const existing = id ? entries.find((entry) => entry.id === id) : undefined;
  if (id && !existing)
    throw new AppError('콘텐츠를 찾을 수 없습니다.', 'NOT_FOUND');
  const entry: Entry = {
    ...parsed.data,
    id: existing?.id ?? `CT-${crypto.randomUUID().slice(0, 8)}`,
    author: existing?.author ?? session.name,
    updatedAt: new Date().toISOString(),
  };
  writeEntries(
    existing
      ? entries.map((item) => (item.id === id ? entry : item))
      : [entry, ...entries],
  );
  return entry;
}

export async function deleteEntries(
  ids: string[],
  session: Session | null,
): Promise<void> {
  requireEditor(session);
  writeEntries(readEntries().filter((entry) => !ids.includes(entry.id)));
}

export async function resetEntries(session: Session | null): Promise<void> {
  requireEditor(session);
  sessionStorage.removeItem(STORAGE_KEY);
}
