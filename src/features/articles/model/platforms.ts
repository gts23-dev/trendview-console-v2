/** 필터와 상세에서 쓰는 전체 이름. */
const PLATFORM_LABELS: Record<string, string> = {
  'naver-blog': '네이버블로그',
  'naver-news': '네이버뉴스',
  'google-news': '구글뉴스',
  youtube: '유튜브',
  instagram: '인스타그램',
  twitter: '트위터',
  facebook: '페이스북',
  tiktok: '틱톡',
};

/**
 * 카드 배지. 로고는 출처, 글자는 콘텐츠 종류다. 규칙을 예외 없이 지켜야
 * 배지 폭이 일정해서 카드가 나란히 읽힌다. 한 브랜드가 여러 종류를 내는
 * 네이버는 블로그 심볼을 따로 쓴다. 키워드 목록처럼 글자 없이 마크만 보이는
 * 자리가 있어서다.
 */
const PLATFORM_BADGES: Record<string, { mark: string; text: string }> = {
  'naver-blog': { mark: 'naver-blog', text: '블로그' },
  'naver-news': { mark: 'naver', text: '뉴스' },
  youtube: { mark: 'youtube', text: '영상' },
  'google-news': { mark: 'google', text: '뉴스' },
  instagram: { mark: 'instagram', text: '게시물' },
  twitter: { mark: 'x', text: '게시물' },
  facebook: { mark: 'facebook', text: '게시물' },
  tiktok: { mark: 'tiktok', text: '영상' },
};

export function getPlatformBadge(platform: string) {
  return (
    PLATFORM_BADGES[platform] ?? { mark: '', text: getPlatformLabel(platform) }
  );
}

export function getPlatformLabel(platform: string) {
  return PLATFORM_LABELS[platform] ?? platform;
}

/**
 * 목록 필터에 노출하는 플랫폼. 기존 콘솔에서 instagram과 twitter는 주석
 * 처리된 상태였으므로 숨긴 채로 옮긴다. 되살릴 때는 이 배열에만 추가한다.
 */
export const PLATFORM_FILTERS = [
  'youtube',
  'naver-blog',
  'google-news',
  'naver-news',
] as const;
