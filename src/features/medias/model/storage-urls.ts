import { z } from 'zod';
import { logger } from '@/shared/logger/logger';

const storageUrlsSchema = z.record(z.string(), z.string().url());

/**
 * `VITE_MEDIA_STORAGE_URLS`는 브라우저에 그대로 노출되는 외부 입력이다.
 * 매체 코드 → 스토리지 URL 형태의 JSON만 받아들이고 나머지는 버린다.
 */
export function parseStorageUrls(raw: string | undefined) {
  if (!raw) return {};
  try {
    const parsed = storageUrlsSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    // 아래에서 함께 알린다.
  }
  // 조용히 비우면 썸네일만 안 보이고 원인을 알 수 없다. .env의 값이 여러 줄이면
  // 첫 줄만 읽히므로 한 줄로 적어야 한다.
  logger.warn(
    'VITE_MEDIA_STORAGE_URLS를 읽지 못해 썸네일이 비어 보일 수 있습니다.',
    {
      code: 'INVALID_STORAGE_URLS',
    },
  );
  return {};
}

let cache: Record<string, string> | null = null;

/** 매체 영문 코드에 해당하는 스토리지 URL. 환경변수는 한 번만 해석한다. */
export function getMediaStorageUrl(code: string) {
  cache ??= parseStorageUrls(import.meta.env?.VITE_MEDIA_STORAGE_URLS);
  return cache[code] ?? '';
}
