/// <reference types="vite/client" />

// vite.config.ts의 define으로 주입된다. 출처는 package.json의 version.
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  /** 헤더에 표시할 배포 환경 이름. 비우면 운영 빌드에서 표시하지 않는다. */
  readonly VITE_ENV_LABEL?: string;
}
