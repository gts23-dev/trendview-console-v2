import { AppError } from '@/shared/errors/app-error';

/** 서버 `schema`에서 헤더에 쓰는 코드를 뽑는다. `trendview-movie` → `movie`. */
export function toMediaCode(schema: string | null | undefined) {
  return (schema ?? '').replace(/^trendview-/, '');
}

/**
 * 코드를 못 구했을 때의 규칙. `TV`는 데이터가 어디 있는지 가리키는 주소라
 * 빠지면 서버가 500을 낸다. 원인을 알 수 있게 여기서 끊는다. `c9`는 서버가
 * 무시하고 설정 조회는 `media_id`로 돌아가므로 없이 보낸다.
 */
export function mediaCodeHeaders(code: string, name: 'TV' | 'c9'): HeadersInit {
  if (code) return { [name]: code };
  if (name === 'TV')
    throw new AppError(
      '매체 정보를 불러오지 못했습니다.',
      'MEDIA_CODE_MISSING',
    );
  return {};
}

interface MediaSchema {
  id: number;
  schema?: string | null;
}

/**
 * 매체 코드는 세션 동안 바뀌지 않으므로 한 번만 받는다. 조회를 여러 개 띄워도
 * 같은 promise를 기다리므로 요청은 한 번이다. 실패는 캐시하지 않는다. 캐시하면
 * 한 번 끊긴 뒤 새로고침 전까지 복구되지 않는다.
 *
 * 목록을 가져오는 방법은 인자로 받는다. 규칙만 여기 두고 통신은 api가 맡는다.
 */
export function createMediaCodes(fetchMedias: () => Promise<MediaSchema[]>) {
  let pending: Promise<Map<number, string>> | null = null;

  function load() {
    pending ??= fetchMedias()
      .then(
        (medias) =>
          new Map(medias.map((media) => [media.id, toMediaCode(media.schema)])),
      )
      .catch((error: unknown) => {
        pending = null;
        throw error;
      });
    return pending;
  }

  async function getMediaCode(mediaId: number) {
    return (await load()).get(mediaId) ?? '';
  }

  /** 매체별 데이터를 구분하는 헤더. 콘텐츠는 `TV`, 설정과 통계는 `c9`다. */
  async function mediaHeaders(
    mediaId: number,
    name: 'TV' | 'c9' = 'TV',
  ): Promise<HeadersInit> {
    // 지금 서버는 c9를 보지 않지만, 기능을 막아 둔 상태일 수 있어 앞으로도
    // 그렇다는 보장이 없다. 받을 수 있으면 기다렸다 붙인다. 목록을 못 받으면
    // 설정 조회는 media_id로 돌아가므로 헤더 없이 보낸다.
    if (name === 'c9')
      return mediaCodeHeaders(
        await getMediaCode(mediaId).catch(() => ''),
        'c9',
      );
    // TV는 실패를 삼키지 않는다. 삼키면 진단 로그에 원인이 남지 않는다.
    return mediaCodeHeaders(await getMediaCode(mediaId), 'TV');
  }

  return { getMediaCode, mediaHeaders };
}
