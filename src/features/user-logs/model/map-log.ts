export const EVENT_LABELS: Record<string, string> = {
  visit: '방문',
  click: '클릭',
  favorite: '즐겨찾기',
  like: '좋아요',
};

export const EVENT_COLORS: Record<string, string> = {
  visit: 'indigo',
  click: 'info',
  favorite: 'green',
  like: 'pink',
};

/**
 * 기존 콘솔의 event → 한글 라벨 매핑은 visit·click·favorite 세 값만 정확히
 * 짚고, 그 외(정말 'like'든 다른 값이든)는 전부 '좋아요'로 본다. 값이 없는
 * 경우까지 포함해 그대로 옮긴다.
 */
export function getEventLabel(event: string) {
  return EVENT_LABELS[event] ?? EVENT_LABELS.like;
}

export function getEventColor(event: string) {
  return EVENT_COLORS[event] ?? EVENT_COLORS.like;
}

export interface UserLogRaw {
  platform: string;
  article_id?: number | string | null;
  event?: string | null;
  tags?: string[] | null;
  user_id: string;
  created_at: string;
  device?: { adid?: string | null } | null;
}

export interface UserLogEntry {
  platform: string;
  articleId: number | string | null;
  /** 글번호가 없으면 방문으로 본다(기존 콘솔과 동일). */
  event: string;
  tags: string[];
  userId: string;
  presentDate: string;
  presentTime: string;
  adid: string | null;
}

export function mapUserLog(raw: UserLogRaw): UserLogEntry {
  const [presentDate = '', presentTime = ''] = raw.created_at.split(' ');
  return {
    platform: raw.platform,
    articleId: raw.article_id ?? null,
    event: raw.article_id ? (raw.event ?? '') : 'visit',
    tags: raw.tags ?? [],
    userId: raw.user_id,
    presentDate,
    presentTime,
    adid: raw.device?.adid ?? null,
  };
}
