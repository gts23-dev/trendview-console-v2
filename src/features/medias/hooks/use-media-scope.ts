import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { pickMediaId } from '../model/media-scope';

const MEDIA_PARAM = 'media';
const STORAGE_KEY = 'trendview.media';

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(mediaId: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(mediaId));
  } catch {
    // 저장하지 못하면 다음 방문에 첫 매체로 시작한다.
  }
}

/**
 * 매체는 화면에 귀속되지 않는 전역 조회 범위다. 값의 단일 출처는 URL이고
 * 저장된 마지막 선택은 기본값으로만 쓴다. URL에 값이 없으면 도착한 화면이
 * 스스로 채우므로 화면 사이에 동기화 코드가 필요하지 않다.
 */
export function useMediaScope() {
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const allowed = session?.medias ?? [];
  const fromUrl = searchParams.get(MEDIA_PARAM);
  const mediaId = pickMediaId(fromUrl, readStored(), allowed);

  useEffect(() => {
    if (mediaId === null || fromUrl === String(mediaId)) return;
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set(MEDIA_PARAM, String(mediaId));
        return next;
      },
      { replace: true },
    );
  }, [mediaId, fromUrl, setSearchParams]);

  const setMediaId = useCallback(
    (next: number) => {
      writeStored(next);
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        params.set(MEDIA_PARAM, String(next));
        // 매체가 바뀌면 페이지만 처음으로 돌리고 나머지 조건은 유지한다.
        params.delete('page');
        return params;
      });
    },
    [setSearchParams],
  );

  return { mediaId, medias: allowed, setMediaId };
}
