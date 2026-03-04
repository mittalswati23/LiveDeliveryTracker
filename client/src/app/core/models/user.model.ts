export interface UserModel {
  email: string;
  role: string;
  displayName: string;
  exp: number;
}

export interface LoginResponse {
  token: string;
  email: string;
  displayName: string;
  role: string;
  expiresAt: string;
}
