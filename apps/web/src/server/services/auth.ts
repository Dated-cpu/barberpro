import { TRPCError } from '@trpc/server';
import { transaction, type TxClient } from '../db/helpers';
import { userRepository } from '../repositories/user';
import { tokenRepository } from '../repositories/token';
import { sessionRepository } from '../repositories/session';
import { hashPassword, verifyPassword, hashToken, generateTokenFamily } from '../lib/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { dispatchEvent, EventTypes } from '../lib/events';
import { emailService } from '../lib/email';
import logger from '../lib/logger';
import type { AuthTokens, AuthUser, JwtRefreshPayload } from '@/types/auth';
import type { RegisterInput, UpdateProfileInput } from '@/validators/auth';
import crypto from 'node:crypto';
import { auditService } from './audit';
import { mediaService } from './media';
import { AuditEvent } from '@/server/security/audit/events';

const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_REMEMBER_EXPIRES_MS = 30 * 24 * 60 * 60 * 1000;
const VERIFICATION_TOKEN_EXPIRES_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_EXPIRES_MS = 60 * 60 * 1000;

function toAuthUser(user: {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  emailVerified?: boolean;
  avatarId?: string | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as AuthUser['role'],
    isActive: user.isActive,
    emailVerified: user.emailVerified ?? false,
    avatarId: user.avatarId ?? null,
  };
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export const authService = {
  async register(input: RegisterInput): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    return transaction(async (tx) => {
      const existingEmail = input.email ? await userRepository.findByEmail(tx, input.email) : null;
      if (existingEmail) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Email already registered' });
      }

      const existingPhone = await userRepository.findByPhone(tx, input.phone);
      if (existingPhone) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Phone already registered' });
      }

      const passwordHash = await hashPassword(input.password);
      const user = await userRepository.create(tx, { ...input, passwordHash });

      if (input.email) {
        const verificationToken = generateToken();
        const tokenHash = hashToken(verificationToken);
        await userRepository.update(tx, user.id, {
          verificationToken: tokenHash,
          verificationTokenExpiresAt: new Date(Date.now() + VERIFICATION_TOKEN_EXPIRES_MS),
        });
        await emailService.sendVerificationEmail(input.email, verificationToken).catch((err) =>
          logger.error('Failed to send verification email', { userId: user.id, error: err }),
        );
      }

      const tokens = await this.createTokens(tx, user.id, user.role);

      await dispatchEvent(tx, {
        eventType: EventTypes.USER_CREATED,
        aggregateType: 'User',
        aggregateId: user.id,
        payload: { userId: user.id, role: user.role },
      });

      logger.info('User registered', { userId: user.id });
      return {
        user: toAuthUser({ ...user, emailVerified: false }),
        tokens,
      };
    });
  },

  async login(
    login: string,
    password: string,
    rememberMe?: boolean,
    device?: string,
    ip?: string,
    userAgent?: string,
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    return transaction(async (tx) => {
      const user = await userRepository.findByLogin(tx, login);
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Account is deactivated' });
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        await auditService.log(tx, { action: AuditEvent.LOGIN_FAILED, entityType: 'User', entityId: user.id, metadata: { login }, ip: ip ?? undefined, userAgent: userAgent ?? undefined });
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
      }

      await userRepository.updateLastLogin(tx, user.id);
      const tokens = await this.createTokens(tx, user.id, user.role, rememberMe, device, ip, userAgent);

      await auditService.log(tx, { actorId: user.id, action: AuditEvent.LOGIN_SUCCESS, entityType: 'User', entityId: user.id, ip: ip ?? undefined, userAgent: userAgent ?? undefined });
      logger.info('User logged in', { userId: user.id });
      return { user: toAuthUser(user), tokens };
    });
  },

  async refresh(refreshTokenStr: string): Promise<AuthTokens> {
    return transaction(async (tx) => {
      let payload: JwtRefreshPayload;
      try {
        payload = verifyRefreshToken(refreshTokenStr);
      } catch {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid refresh token' });
      }

      const tokenHash = hashToken(refreshTokenStr);
      const storedToken = await tokenRepository.findByHash(tx, tokenHash);

      if (!storedToken || storedToken.revokedAt) {
        if (storedToken?.family) {
          await tokenRepository.revokeFamily(tx, storedToken.family);
          await sessionRepository.revokeAllByUserId(tx, payload.userId);
          await auditService.log(tx, { actorId: payload.userId, action: AuditEvent.TOKEN_REUSE_DETECTED, entityType: 'RefreshToken', entityId: storedToken.id, metadata: { family: storedToken.family } });
          logger.warn('Refresh token reuse detected — all sessions revoked', { userId: payload.userId, family: storedToken.family });
        }
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Token revoked or reused' });
      }

      if (storedToken.expiresAt < new Date()) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Token expired' });
      }

      await tokenRepository.revoke(tx, storedToken.id);

      const user = await userRepository.findById(tx, payload.userId);
      if (!user || !user.isActive) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not found or inactive' });
      }

      return this.createTokens(tx, user.id, user.role);
    });
  },

  async logout(refreshTokenStr: string): Promise<void> {
    return transaction(async (tx) => {
      const tokenHash = hashToken(refreshTokenStr);
      const storedToken = await tokenRepository.findByHash(tx, tokenHash);
      if (storedToken) {
        await tokenRepository.revoke(tx, storedToken.id);
      }
    });
  },

  async logoutAllDevices(userId: string): Promise<void> {
    return transaction(async (tx) => {
      await tokenRepository.revokeAllByUserId(tx, userId);
      await sessionRepository.revokeAllByUserId(tx, userId);
    });
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(await import('../db/client').then((m) => m.default), email);
    if (!user) {
      // Don't reveal whether the email exists
      return;
    }

    const resetToken = generateToken();
    const tokenHash = hashToken(resetToken);

    await transaction(async (tx) => {
      await userRepository.update(tx, user.id, {
        resetPasswordToken: tokenHash,
        resetPasswordExpiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRES_MS),
      });
    });

    await emailService.sendPasswordReset(email, resetToken).catch((err) =>
      logger.error('Failed to send password reset email', { userId: user.id, error: err }),
    );
  },

  async resetPassword(token: string, password: string): Promise<void> {
    const tokenHash = hashToken(token);

    await transaction(async (tx) => {
      const user = await userRepository.findByResetToken(tx, tokenHash);
      if (!user) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid or expired reset token' });
      }

      const passwordHash = await hashPassword(password);
      await userRepository.updatePassword(tx, user.id, passwordHash);

      await tokenRepository.revokeAllByUserId(tx, user.id);

      await auditService.log(tx, { actorId: user.id, action: AuditEvent.PASSWORD_RESET, entityType: 'User', entityId: user.id });
      logger.info('Password reset completed', { userId: user.id });
    });
  },

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = hashToken(token);

    await transaction(async (tx) => {
      const user = await userRepository.findByVerificationToken(tx, tokenHash);
      if (!user) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid or expired verification token' });
      }

      await userRepository.update(tx, user.id, {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      });

      logger.info('Email verified', { userId: user.id });
    });
  },

  async resendVerification(userId: string): Promise<void> {
    return transaction(async (tx) => {
      const user = await userRepository.findById(tx, userId);
      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      if (user.emailVerified) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email already verified' });
      if (!user.email) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No email on file' });

      const verificationToken = generateToken();
      const tokenHash = hashToken(verificationToken);
      await userRepository.update(tx, userId, {
        verificationToken: tokenHash,
        verificationTokenExpiresAt: new Date(Date.now() + VERIFICATION_TOKEN_EXPIRES_MS),
      });

      await emailService.sendVerificationEmail(user.email, verificationToken).catch((err) =>
        logger.error('Failed to resend verification email', { userId, error: err }),
      );
    });
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<AuthUser> {
    return transaction(async (tx) => {
      const user = await userRepository.findById(tx, userId);
      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      const updateData: Record<string, unknown> = {};

      if (input.firstName !== undefined) updateData.firstName = input.firstName;
      if (input.lastName !== undefined) updateData.lastName = input.lastName;
      if (input.phone !== undefined) {
        const existing = await userRepository.findByPhone(tx, input.phone);
        if (existing && existing.id !== userId) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Phone already in use' });
        }
        updateData.phone = input.phone;
      }
      if (input.email !== undefined && input.email !== null) {
        const existing = await userRepository.findByEmail(tx, input.email);
        if (existing && existing.id !== userId) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Email already in use' });
        }
        updateData.email = input.email;
        updateData.emailVerified = false;

        const verificationToken = generateToken();
        const tokenHash = hashToken(verificationToken);
        updateData.verificationToken = tokenHash;
        updateData.verificationTokenExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRES_MS);

        await emailService.sendVerificationEmail(input.email, verificationToken).catch((err) =>
          logger.error('Failed to send verification email', { userId, error: err }),
        );
      }

      const updated = await userRepository.update(tx, userId, updateData);
      return toAuthUser(updated);
    });
  },

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    return transaction(async (tx) => {
      const user = await userRepository.findById(tx, userId);
      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      if (!user.passwordHash) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot change password for this account' });
      }

      const valid = await verifyPassword(oldPassword, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Current password is incorrect' });
      }

      const passwordHash = await hashPassword(newPassword);
      await userRepository.updatePassword(tx, userId, passwordHash);

      await tokenRepository.revokeAllByUserId(tx, userId);

      await auditService.log(tx, { actorId: userId, action: AuditEvent.PASSWORD_CHANGED, entityType: 'User', entityId: userId });
      logger.info('Password changed', { userId });
    });
  },

  async uploadAvatar(userId: string, file: { buffer: Buffer; originalname: string; mimetype: string; size: number }): Promise<string> {
    const media = await mediaService.upload(file, userId);
    await transaction(async (tx) => {
      await userRepository.update(tx, userId, { avatarId: media.id });
    });
    return media.url;
  },

  async createTokens(
    tx: TxClient,
    userId: string,
    role: string,
    rememberMe?: boolean,
    device?: string,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const tokenFamily = generateTokenFamily();
    const expiresInMs = rememberMe ? REFRESH_TOKEN_REMEMBER_EXPIRES_MS : REFRESH_TOKEN_EXPIRES_MS;
    const expiresAt = new Date(Date.now() + expiresInMs);

    const accessToken = signAccessToken({ userId, role: role as 'ADMIN' | 'BARBER' | 'CLIENT' });
    const refreshToken = signRefreshToken({ userId, tokenFamily });
    const tokenHash = hashToken(refreshToken);

    const created = await tokenRepository.create(tx, {
      userId,
      tokenHash,
      family: tokenFamily,
      expiresAt,
    });

    await sessionRepository.create(tx, {
      userId,
      device,
      ip,
      userAgent,
      refreshTokenId: created.id,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  },
};
