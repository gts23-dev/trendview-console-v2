/**
 * 이 API의 여러 엔드포인트가 순서 있는 목록을 배열로도, 문자열 키를 가진
 * 객체로도 준다 — 같은 필드가 요청 조건(예: date_choice)에 따라 다른 모양으로
 * 오는 게 실제로 확인됐고, 확정된 규칙은 없다. 어느 쪽이 오든 값의 순서를
 * 그대로 살려 배열로 맞춘다. 정수형 문자열 키는 항상 오름차순으로 순회되므로
 * 배열이었을 때의 인덱스 순서와 같다.
 */
export function toOrderedList<T>(
  raw: T[] | Record<string, T> | null | undefined,
): T[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : Object.values(raw);
}
