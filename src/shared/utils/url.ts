/** 기준 URL과 상대 경로를 슬래시 중복 없이 합친다. */
export function joinUrl(baseUrl: string, path: string) {
  if (!baseUrl || !path) return '';
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
