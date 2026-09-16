/**
 * 유튜브 주소에서 영상 id를 뽑는다. 수집분에는 일반 영상(`watch?v=`), 단축
 * 주소(`youtu.be/`), 쇼츠(`/shorts/`)가 섞여 있다.
 */
export function getYoutubeId(url: string) {
  if (!url) return '';
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return '';
  }
  if (!/(^|\.)(youtube\.com|youtu\.be)$/.test(parsed.hostname)) return '';
  const fromQuery = parsed.searchParams.get('v');
  if (fromQuery) return isVideoId(fromQuery) ? fromQuery : '';
  // `/watch` 이외 경로는 마지막 조각이 id다. youtu.be는 경로가 id뿐이다.
  const last = parsed.pathname.split('/').filter(Boolean).pop() ?? '';
  return isVideoId(last) ? last : '';
}

function isVideoId(value: string) {
  return /^[\w-]{11}$/.test(value);
}

/** 재생용 주소. 쿠키를 남기지 않는 도메인을 쓴다. */
export function getYoutubeEmbedUrl(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

/**
 * 쇼츠 여부. 주소에 `/shorts/`가 있으면 확실하고, 수집 과정에서 일반 영상
 * 주소로 바뀐 경우가 있어 세로형 썸네일도 쇼츠로 본다.
 */
export function isYoutubeShorts(url: string, imageWidth = 0, imageHeight = 0) {
  if (/\/shorts\//.test(url)) return true;
  return imageWidth > 0 && imageHeight > imageWidth;
}
