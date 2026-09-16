/** 로그인 운영자가 다룰 수 있는 매체. `me` 응답의 user_media에서 온다. */
export interface SessionMedia {
  id: number;
  name: string;
}

export interface Session {
  id: string;
  name: string;
  email: string;
  /** 어드민 이용등급. 0이면 통계와 일부 설정 메뉴를 숨긴다. */
  grade: number;
  medias: SessionMedia[];
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthAdapter {
  getSession(): Promise<Session | null>;
  signIn(input: LoginInput): Promise<Session>;
  signOut(): Promise<void>;
}

/**
 * 등급 판단은 이 함수 한 곳에서만 한다. 기존 콘솔은 `grade !== 0`으로 통계와
 * 사용자·노출 설정 메뉴를 구분했다. 화면 표시용 판단이며 실제 인가는 서버가
 * 검증한다.
 */
export function isAdminGrade(session: Session | null) {
  return (session?.grade ?? 0) !== 0;
}
