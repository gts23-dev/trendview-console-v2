import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseCount } from '../src/shared/utils/format.ts';

describe('숫자 파싱', () => {
  it('숫자는 그대로 쓴다', () => {
    assert.equal(parseCount(653), 653);
    assert.equal(parseCount(0), 0);
  });
  it('콤마 포함 숫자 문자열도 숫자로 바꾼다', () => {
    assert.equal(parseCount('2,955'), 2955);
    assert.equal(parseCount('653'), 653);
  });
  it('숫자로 바꿀 수 없거나 없는 값은 0으로 본다', () => {
    assert.equal(parseCount('오류'), 0);
    assert.equal(parseCount(null), 0);
    assert.equal(parseCount(undefined), 0);
    assert.equal(parseCount(Number.POSITIVE_INFINITY), 0);
  });
});
