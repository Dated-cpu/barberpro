import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtAccessPayload, JwtRefreshPayload } from '@/types/auth';

export function signAccessToken(payload: Omit<JwtAccessPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload as object, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions);
}

export function signRefreshToken(payload: Omit<JwtRefreshPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload as object, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
}
