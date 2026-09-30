/** 등급 번호. 서버 `config`와 화면이 같은 순서를 쓴다. */
export const GRADES = [1, 2, 3, 4] as const;

/**
 * 등급 가중치를 슬라이더 경계 셋으로 바꾼다. 앞 등급이 끝나는 곳에서 다음
 * 등급이 시작하고 4등급은 100까지의 나머지다(기존 콘솔 규칙). 그래서 4등급
 * 값은 읽지 않는다. 빠진 등급은 0으로 본다.
 */
export function toGradeCuts(weights: readonly number[]) {
  const cuts: number[] = [];
  let edge = 0;
  for (let index = 0; index < GRADES.length - 1; index += 1) {
    // 슬라이더는 경계가 오름차순이어야 한다. 음수는 0으로 본다.
    edge = Math.min(100, edge + Math.max(0, weights[index] ?? 0));
    cuts.push(edge);
  }
  return cuts;
}

/** 경계 셋을 등급 가중치 넷으로 되돌린다. 합은 항상 100이다. */
export function toGradeWeights(cuts: readonly number[]) {
  const edges = [0, ...cuts, 100];
  return edges.slice(1).map((edge, index) => edge - edges[index]);
}

/**
 * 등급별 기간(며칠 전부터 며칠 전까지). 기존 콘솔 화면의 계산식이다. 서버
 * 계산과 같은지 확인되지 않았으므로 식을 바꾸려면 먼저 서버에 확인한다.
 */
export function gradeReferenceRanges(referenceDay: number, term: number) {
  const ranges = [{ from: 0, to: referenceDay }];
  let to = referenceDay;
  while (ranges.length < GRADES.length) {
    const from = to + 1;
    to = from + term;
    ranges.push({ from, to });
  }
  return ranges;
}
