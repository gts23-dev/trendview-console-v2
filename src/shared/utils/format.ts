const numberFormat = new Intl.NumberFormat('ko-KR');

export function formatCount(value: number | null | undefined) {
  return numberFormat.format(value ?? 0);
}

/**
 * 이 API의 숫자 필드는 JSON 숫자, 콤마 포함 문자열("2,955"), 없음(null·
 * undefined)이 뒤섞여 온다. 어떤 형태로 오든 안전하게 숫자로 만든다. 셋 다
 * 아니거나 숫자로 못 바꾸면 0으로 본다.
 */
export function parseCount(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/** 오늘 기준으로 며칠 전 날짜를 `YYYY-MM-DD`로 만든다. */
export function shiftDate(days: number, from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() - days);
  // 표시와 요청 모두 로컬 날짜 기준이므로 UTC로 변환하지 않는다.
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function today(from = new Date()) {
  return shiftDate(0, from);
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 'YYYY-MM-DD'의 요일을 한글 한 글자로 돌려준다. 통계 화면 여러 곳이
 * 구간 카드 제목에 요일을 붙일 때 쓴다. */
export function getWeekdayLabel(date: string) {
  return WEEKDAYS[new Date(date).getDay()];
}
