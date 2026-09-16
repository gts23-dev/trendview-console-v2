const numberFormat = new Intl.NumberFormat('ko-KR');

export function formatCount(value: number | null | undefined) {
  return numberFormat.format(value ?? 0);
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
