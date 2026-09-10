import assert from 'node:assert/strict';
import { after, beforeEach, it } from 'node:test';
import type { Session } from '../src/features/auth/model.ts';
import {
  deleteEntries,
  getEntries,
  resetEntries,
  saveEntry,
} from '../src/features/entries/api/entries.ts';
import { AppError } from '../src/shared/errors/app-error.ts';

const ADMIN: Session = { id: 'demo-admin', name: '관리자', role: 'admin' };
const VIEWER: Session = { id: 'demo-viewer', name: '조회자', role: 'viewer' };
const INPUT = {
  title: ' 테스트 ',
  category: '공지',
  status: 'draft',
  description: '',
} as const;
const originalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  'sessionStorage',
);

beforeEach(() => {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: storage,
    configurable: true,
  });
});

after(() => {
  if (originalStorage)
    Object.defineProperty(globalThis, 'sessionStorage', originalStorage);
  else Reflect.deleteProperty(globalThis, 'sessionStorage');
});

it('등록·수정·삭제·초기화 결과가 같은 저장소의 다음 조회에 반영된다', async () => {
  const initial = await getEntries();
  const saved = await saveEntry(INPUT, ADMIN);
  assert.equal(saved.title, '테스트');
  assert.equal((await getEntries()).length, initial.length + 1);
  const updated = await saveEntry({ ...INPUT, title: '수정' }, ADMIN, saved.id);
  assert.equal(updated.id, saved.id);
  assert.equal(updated.author, saved.author);
  assert.equal(
    (await getEntries()).find((entry) => entry.id === saved.id)?.title,
    '수정',
  );
  await deleteEntries([saved.id], ADMIN);
  assert.equal((await getEntries()).length, initial.length);
  await deleteEntries([initial[0].id], ADMIN);
  await resetEntries(ADMIN);
  assert.deepEqual(await getEntries(), initial);
});

it('조회 계정과 미로그인 요청은 모든 변경을 거부하고 데이터를 보존한다', async () => {
  const initial = await getEntries();
  for (const session of [VIEWER, null]) {
    for (const request of [
      () => saveEntry(INPUT, session),
      () => deleteEntries([initial[0].id], session),
      () => resetEntries(session),
    ]) {
      await assert.rejects(
        request,
        (error: unknown) =>
          error instanceof AppError && error.code === 'FORBIDDEN',
      );
    }
  }
  assert.deepEqual(await getEntries(), initial);
});

it('잘못된 입력과 존재하지 않는 수정 대상은 새 데이터를 만들지 않는다', async () => {
  const initial = await getEntries();
  await assert.rejects(
    saveEntry({ ...INPUT, title: ' ' }, ADMIN),
    (error: unknown) =>
      error instanceof AppError && error.code === 'INVALID_INPUT',
  );
  await assert.rejects(
    saveEntry(INPUT, ADMIN, 'missing'),
    (error: unknown) => error instanceof AppError && error.code === 'NOT_FOUND',
  );
  assert.deepEqual(await getEntries(), initial);
});

it('손상된 저장값을 조용히 덮어쓰지 않고 명시적인 초기화로 복구한다', async () => {
  sessionStorage.setItem('console-boilerplate.entries.v1', 'broken');
  await assert.rejects(
    getEntries,
    (error: unknown) =>
      error instanceof AppError && error.code === 'INVALID_DEMO_DATA',
  );
  assert.equal(
    sessionStorage.getItem('console-boilerplate.entries.v1'),
    'broken',
  );
  await resetEntries(ADMIN);
  assert.equal((await getEntries()).length, 24);
});
