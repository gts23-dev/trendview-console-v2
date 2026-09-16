/**
 * 매체 id에 대응하는 영문 코드. 서버가 요구하는 `TV` 헤더 값이고 스토리지
 * URL을 고르는 열쇠이기도 하다. 기존 콘솔은 이 대응을 `main.js`의 switch에
 * 두고 49곳에서 호출했다. 신규 매체가 생기면 이 파일만 고친다.
 *
 * 서버 `GET api/v1/medias` 응답에 코드가 포함되면 이 표는 지운다.
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

/** 매체별 데이터를 구분하는 서버 요구 헤더. */
export function mediaHeaders(mediaId: number): HeadersInit {
  const code = getMediaCode(mediaId);
  return code ? { TV: code } : {};
}
