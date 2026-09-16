import assert from 'node:assert/strict';
import { it, mock } from 'node:test';
import { MutationObserver } from '@tanstack/react-query';
import {
  ApiError,
  AppError,
  getErrorMessage,
} from '../src/shared/errors/app-error.ts';
import { createAppQueryClient } from '../src/shared/query/query-client.ts';

it('안전하게 정의한 오류만 화면에 표시하고 내부 오류는 기본 문구로 바꾼다', () => {
  assert.equal(
    getErrorMessage(new AppError('다시 입력해 주세요.', 'INVALID_INPUT')),
    '다시 입력해 주세요.',
  );
  assert.equal(
    getErrorMessage(new ApiError('접근 권한이 없습니다.', 403)),
    '접근 권한이 없습니다.',
  );
  for (const error of [new Error('token=secret'), 'private response', null]) {
    assert.equal(
      getErrorMessage(error),
      '요청을 처리하지 못했습니다. 다시 시도해 주세요.',
    );
  }
});

it('저장 실패는 로컬 오류 콜백이 있어도 전역에서 한 번 알리고 재시도하지 않는다', async () => {
  const output = mock.method(console, 'error', () => {});
  const notices: string[] = [];
  const client = createAppQueryClient((message) => {
    notices.push(message);
  });
  let attempts = 0;
  let localErrors = 0;
  const mutation = new MutationObserver(client, {
    mutationFn: async () => {
      attempts += 1;
      throw new AppError('수정 권한이 없습니다.', 'FORBIDDEN');
    },
    onError: () => {
      localErrors += 1;
    },
  });
  try {
    await assert.rejects(mutation.mutate());
    assert.equal(attempts, 1);
    assert.equal(localErrors, 1);
    assert.deepEqual(notices, ['수정 권한이 없습니다.']);
  } finally {
    client.clear();
    output.mock.restore();
  }
});

it('조회 실패는 화면 오류 상태로 넘기고 저장 실패 토스트를 띄우지 않는다', async () => {
  const output = mock.method(console, 'error', () => {});
  const notices: string[] = [];
  const client = createAppQueryClient((message) => {
    notices.push(message);
  });
  try {
    await assert.rejects(
      client.fetchQuery({
        queryKey: ['example'],
        queryFn: async () => {
          throw new Error('private');
        },
        retry: false,
      }),
    );
    assert.deepEqual(notices, []);
    assert.equal(client.getQueryState(['example'])?.status, 'error');
  } finally {
    client.clear();
    output.mock.restore();
  }
});
