import type { UserRole } from '@prisma/client';

export interface JwtAccessPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  userId: string;
  tokenFamily: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  emailVerified?: boolean;
  avatarId?: string | null;
  description?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}
