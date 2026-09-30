import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  gradeReferenceRanges,
  toGradeCuts,
  toGradeWeights,
} from '../src/features/exposure/model/grades.ts';

describe('등급별 할당율', () => {
  it('가중치를 누적해 등급 경계 셋으로 바꾼다', () => {
    assert.deepEqual(toGradeCuts([50, 25, 15, 10]), [50, 75, 90]);
  });

  it('설정이 없으면 경계 셋을 모두 0에 둔다', () => {
    assert.deepEqual(toGradeCuts([]), [0, 0, 0]);
  });

  it('경계는 앞 경계보다 작아지지 않고 100을 넘지 않는다', () => {
    assert.deepEqual(toGradeCuts([60, 30, 20, 10]), [60, 90, 100]);
    assert.deepEqual(toGradeCuts([50, -10, 15, 0]), [50, 50, 65]);
  });

  it('경계를 가중치로 되돌리면 4등급이 나머지를 가져 합이 100이다', () => {
    assert.deepEqual(toGradeWeights([50, 75, 90]), [50, 25, 15, 10]);
    assert.deepEqual(toGradeWeights([0, 0, 0]), [0, 0, 0, 100]);
  });

  it('서버 값의 합이 100이 아니어도 4등급을 나머지로 맞춘다', () => {
    assert.deepEqual(
      toGradeWeights(toGradeCuts([40, 20, 10, 10])),
      [40, 20, 10, 30],
    );
  });
});

describe('등급별 기간', () => {
  it('1등급은 기준일까지, 다음 등급은 다음 날부터 주기만큼이다', () => {
    assert.deepEqual(gradeReferenceRanges(3, 7), [
      { from: 0, to: 3 },
      { from: 4, to: 11 },
      { from: 12, to: 19 },
      { from: 20, to: 27 },
    ]);
  });

  it('기준일과 주기가 0이면 하루씩 이어진다', () => {
    assert.deepEqual(gradeReferenceRanges(0, 0), [
      { from: 0, to: 0 },
      { from: 1, to: 1 },
      { from: 2, to: 2 },
      { from: 3, to: 3 },
    ]);
  });
});
