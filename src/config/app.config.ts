// 새 프로젝트를 시작할 때 이 파일의 값만 바꾸면 화면 전체의 서비스 이름이 바뀐다.
export const APP_CONFIG = {
  /** 문서 제목, 로그인 화면, 하단 표기에 쓰는 전체 이름 */
  name: 'Console Boilerplate',
  /** 사이드바 로고 옆 짧은 이름 */
  brand: 'console',
  /** package.json의 version (vite define으로 주입) */
  version: __APP_VERSION__,
} as const;
