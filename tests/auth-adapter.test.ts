import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';

// adapter.ts는 브라우저 전용 모듈을 통해 실제 API를 호출한다. 여기서는 인증
// 구현 선택이 한 파일에만 있는지, 그리고 앱이 쓰기 경로 없는 fetcher로
// client를 만드는지를 소스로 확인한다.
it('인증 구현은 adapter 파일 한 곳에서 선택한다', () => {
  const adapter = readFileSync('src/features/auth/adapter.ts', 'utf8');
  assert.match(adapter, /export \{ httpAuthAdapter as authAdapter \}/);
  const provider = readFileSync('src/features/auth/provider.tsx', 'utf8');
  assert.match(provider, /from '\.\/adapter'/);
  assert.doesNotMatch(provider, /http-adapter|api\/auth/);
});

it('앱의 HTTP client는 변경 요청을 막는 fetcher로 만든다', () => {
  const client = readFileSync('src/shared/api/client.ts', 'utf8');
  assert.match(client, /fetcher: createReadOnlyFetcher\(\)/);
});
