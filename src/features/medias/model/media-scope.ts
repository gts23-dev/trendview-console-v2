import type { SessionMedia } from '@/features/auth';

/**
 * 전역 매체 범위를 결정한다. 우선순위는 URL, 브라우저에 저장한 마지막 선택,
 * 로그인 운영자의 첫 매체 순이다.
 *
 * 저장값은 신뢰 경계 밖에 있다. 권한이 바뀌어 더 이상 볼 수 없는 매체가
 * 저장돼 있으면 버리고 볼 수 있는 첫 매체로 되돌린다.
 */
export function pickMediaId(
  fromUrl: string | null,
  stored: string | null,
  allowed: SessionMedia[],
): number | null {
  for (const candidate of [fromUrl, stored]) {
    const id = Number(candidate);
    if (candidate && Number.isInteger(id) && allowed.some((m) => m.id === id))
      return id;
  }
  return allowed[0]?.id ?? null;
}
