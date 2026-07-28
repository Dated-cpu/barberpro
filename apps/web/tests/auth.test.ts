import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, hashToken } from '../src/server/lib/hash';

describe('Auth utilities', () => {
  describe('hashPassword / verifyPassword', () => {
    it('should hash and verify password correctly', async () => {
      const password = 'TestPass123';
      const hash = await hashPassword(password);
      expect(hash).not.toBe(password);
      const valid = await verifyPassword(password, hash);
      expect(valid).toBe(true);
    });

    it('should reject wrong password', async () => {
      const hash = await hashPassword('TestPass123');
      const valid = await verifyPassword('WrongPass456', hash);
      expect(valid).toBe(false);
    });
  });

  describe('hashToken', () => {
    it('should produce consistent hash', () => {
      const token = 'test-refresh-token';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('should produce different hashes for different tokens', () => {
      const hash1 = hashToken('token-a');
      const hash2 = hashToken('token-b');
      expect(hash1).not.toBe(hash2);
    });
  });
});
