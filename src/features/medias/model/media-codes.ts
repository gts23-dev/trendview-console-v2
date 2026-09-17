/**
 * 매체 id에 대응하는 영문 코드. 매체 헤더 값이자 스토리지 URL을 고르는
 * 열쇠다. 서버 `GET api/v1/medias` 응답에 코드가 포함되면 이 표는 지운다.
 */
export const MEDIA_CODES: Record<number, string> = {
  1: 'main',
  2: 'default',
  3: 'movie',
  4: 'livescore',
  5: 'cultureland',
  6: 'lottecinema',
  7: 'paybooc',
  8: 'happypoint',
  9: 'fleamarket',
  10: 'lottemembers',
  11: 'metaclub',
  12: 'scorecenter',
  13: 'bible25',
};

export function getMediaCode(mediaId: number) {
  return MEDIA_CODES[mediaId] ?? '';
}

/**
 * 매체별 데이터를 구분하는 헤더. 값은 같은데 이름이 엔드포인트 계열마다
 * 다르다. 콘텐츠는 `TV`, 설정과 통계는 `c9`다. 기존 콘솔도 그렇게 나뉜다.
 */
export function mediaHeaders(
  mediaId: number,
  name: 'TV' | 'c9' = 'TV',
): HeadersInit {
  const code = getMediaCode(mediaId);
  return code ? { [name]: code } : {};
}
