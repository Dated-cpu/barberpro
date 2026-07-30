import { describe, it, expect, vi } from 'vitest';
import { AuditEvent } from '../../src/server/security/audit/events';

const mockRevokeFamily = vi.fn();
const mockRevokeAllByUserId = vi.fn();

vi.mock('../../src/server/repositories/session', () => ({
  sessionRepository: {
    revokeAllByUserId: (...args: unknown[]) => mockRevokeAllByUserId(...args),
    create: vi.fn(),
    findByUserId: vi.fn(),
    revoke: vi.fn(),
    updateActivity: vi.fn(),
  },
}));

vi.mock('../../src/server/repositories/token', () => ({
  tokenRepository: {
    findByHash: vi.fn(),
    revokeFamily: (...args: unknown[]) => mockRevokeFamily(...args),
    revokeAllByUserId: vi.fn(),
    revoke: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../src/server/db/helpers', () => ({
  transaction: <T>(fn: (tx: unknown) => Promise<T>) => fn({}),
}));

vi.mock('../../src/server/lib/jwt', () => ({
  verifyRefreshToken: vi.fn().mockReturnValue({ userId: 'user-1', tokenFamily: 'family-1' }),
  signAccessToken: vi.fn().mockReturnValue('access-token'),
  signRefreshToken: vi.fn().mockReturnValue('refresh-token'),
}));

vi.mock('../../src/server/lib/hash', () => ({
  hashToken: vi.fn().mockReturnValue('hashed-token'),
  generateTokenFamily: vi.fn().mockReturnValue('family-1'),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock('../../src/server/repositories/user', () => ({
  userRepository: {
    findById: vi.fn().mockResolvedValue({ id: 'user-1', role: 'CLIENT', isActive: true }),
    findByLogin: vi.fn(),
    findByEmail: vi.fn(),
    findByPhone: vi.fn(),
    findByVerificationToken: vi.fn(),
    findByResetToken: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateLastLogin: vi.fn(),
    updatePassword: vi.fn(),
    listByRole: vi.fn(),
  },
}));

vi.mock('../../src/server/services/audit', () => ({
  auditService: {
    log: vi.fn(),
  },
}));

vi.mock('../../src/server/lib/email', () => ({
  emailService: {
    sendVerificationEmail: vi.fn(),
    sendPasswordReset: vi.fn(),
  },
}));

vi.mock('../../src/server/lib/events', () => ({
  dispatchEvent: vi.fn(),
  EventTypes: {},
}));

vi.mock('../../src/server/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../src/server/services/media', () => ({
  mediaService: {
    upload: vi.fn(),
  },
}));

describe('Session reuse detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should revoke family and all sessions on reuse', async () => {
    const { tokenRepository } = await import('../../src/server/repositories/token');
    const { sessionRepository } = await import('../../src/server/repositories/session');
    const { authService } = await import('../../src/server/services/auth');

    vi.mocked(tokenRepository.findByHash).mockResolvedValue({
      id: 'token-1',
      family: 'family-1',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      userId: 'user-1',
      tokenHash: 'hashed-token',
      createdAt: new Date(),
    });

    await expect(authService.refresh('old-refresh-token')).rejects.toThrow('Token revoked or reused');

    expect(mockRevokeFamily).toHaveBeenCalledWith(expect.anything(), 'family-1');
    expect(mockRevokeAllByUserId).toHaveBeenCalledWith(expect.anything(), 'user-1');
  });

  it('should NOT revoke sessions when no family exists', async () => {
    const { tokenRepository } = await import('../../src/server/repositories/token');
    const { authService } = await import('../../src/server/services/auth');

    vi.mocked(tokenRepository.findByHash).mockResolvedValue({
      id: 'token-1',
      family: null as unknown as string,
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      userId: 'user-1',
      tokenHash: 'hashed-token',
      createdAt: new Date(),
    });

    await expect(authService.refresh('old-refresh-token')).rejects.toThrow('Token revoked or reused');

    expect(mockRevokeFamily).not.toHaveBeenCalled();
    expect(mockRevokeAllByUserId).not.toHaveBeenCalled();
  });

  it('should throw for unknown token', async () => {
    const { tokenRepository } = await import('../../src/server/repositories/token');
    const { authService } = await import('../../src/server/services/auth');

    vi.mocked(tokenRepository.findByHash).mockResolvedValue(null);

    await expect(authService.refresh('unknown-token')).rejects.toThrow('Token revoked or reused');

    expect(mockRevokeFamily).not.toHaveBeenCalled();
    expect(mockRevokeAllByUserId).not.toHaveBeenCalled();
  });
});
