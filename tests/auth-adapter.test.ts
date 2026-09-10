import assert from 'node:assert/strict';
import { it } from 'node:test';
import { authAdapter } from '../src/features/auth/adapter.ts';
import { demoAuthAdapter } from '../src/features/auth/demo-adapter.ts';

it('인증 구현은 adapter 파일 한 곳에서 선택한다', () => {
  assert.equal(authAdapter, demoAuthAdapter);
});
