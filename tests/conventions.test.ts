import assert from 'node:assert/strict';
import { it, mock } from 'node:test';
import { MutationObserver } from '@tanstack/react-query';
import {
  ApiError,
  AppError,
  getErrorMessage,
} from '../src/shared/errors/app-error.ts';
import { logger } from '../src/shared/logger/logger.ts';
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

it('로그는 허용된 진단 정보만 남기고 요청 내용과 자격 증명을 버린다', () => {
  const output = mock.method(console, 'error', () => {});
  try {
    logger.error('저장 실패', {
      status: 500,
      code: 'HTTP_ERROR',
      ...{
        token: 'secret',
        variables: { title: 'private' },
        error: new Error('secret'),
      },
    });
    assert.deepEqual(output.mock.calls[0].arguments[1], {
      status: 500,
      code: 'HTTP_ERROR',
    });
    assert.match(
      String(output.mock.calls[0].arguments[0]),
      /^\[.+\] \[ERROR\] 저장 실패$/,
    );
  } finally {
    output.mock.restore();
  }
});

it('안내와 경고 로그는 레벨과 안전한 집계 값만 출력한다', () => {
  const info = mock.method(console, 'info', () => {});
  const warn = mock.method(console, 'warn', () => {});
  try {
    logger.info('조회 완료', { count: 2, durationMs: 10 });
    logger.warn('재시도 필요');
    assert.deepEqual(info.mock.calls[0].arguments[1], {
      count: 2,
      durationMs: 10,
    });
    assert.deepEqual(warn.mock.calls[0].arguments[1], {});
  } finally {
    info.mock.restore();
    warn.mock.restore();
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
