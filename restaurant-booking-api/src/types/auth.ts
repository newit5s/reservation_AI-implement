import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  branchId?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface RefreshPayload {
  refreshToken: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface PasswordResetRequestPayload {
  email: string;
}
