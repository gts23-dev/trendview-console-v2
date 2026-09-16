/// <reference types="vite/client" />

// vite.config.ts의 define으로 주입된다. 출처는 package.json의 version.
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  /** API 서버 주소. 예: https://api.example.com */
  readonly VITE_API_BASE_URL: string;
  /** 헤더에 표시할 배포 환경 이름. 비우면 운영 빌드에서 표시하지 않는다. */
  readonly VITE_ENV_LABEL?: string;
  /** 매체 코드별 스토리지 URL. JSON 객체 문자열이며 경계에서 검증한다. */
  readonly VITE_MEDIA_STORAGE_URLS?: string;
  /** oauth password grant의 client 식별자. 브라우저에 공개되는 값이다. */
  readonly VITE_OAUTH_CLIENT_ID: string;
  /** oauth password grant의 client secret. 브라우저에 공개되는 값이다. */
  readonly VITE_OAUTH_CLIENT_SECRET: string;
}
