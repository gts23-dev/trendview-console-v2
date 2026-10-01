export interface UserMedia {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  /** 이 사용자가 볼 수 있는 매체. */
  medias: UserMedia[];
}

export interface UserListResult {
  /** 현재 매체에 속한 사용자. */
  users: User[];
  /** 현재 매체에 속하지 않은 사용자. 기존 사용자 추가의 후보다. */
  candidates: User[];
}

export interface CreateUserInput {
  mediaId: number;
  email: string;
  name: string;
  password: string;
  passwordConfirmation: string;
}

export interface AddUserMediaInput {
  userId: number;
  mediaId: number;
}
