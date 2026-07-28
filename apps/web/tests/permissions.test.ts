import { describe, it, expect } from 'vitest';
import { isValidRole, canAccessResource } from '../src/trpc/middleware/auth';

describe('Permissions', () => {
  describe('isValidRole', () => {
    it('should accept allowed roles', () => {
      expect(isValidRole('ADMIN', ['ADMIN', 'SUPER_ADMIN'])).toBe(true);
      expect(isValidRole('SUPER_ADMIN', ['ADMIN', 'SUPER_ADMIN'])).toBe(true);
    });

    it('should reject forbidden roles', () => {
      expect(isValidRole('CLIENT', ['ADMIN', 'SUPER_ADMIN'])).toBe(false);
      expect(isValidRole('BARBER', ['ADMIN', 'SUPER_ADMIN'])).toBe(false);
    });
  });

  describe('canAccessResource', () => {
    it('should allow admin to access any resource', () => {
      expect(canAccessResource('admin-1', 'client-1', 'ADMIN')).toBe(true);
    });

    it('should allow owner to access own resource', () => {
      expect(canAccessResource('user-1', 'user-1', 'CLIENT')).toBe(true);
    });

    it('should deny non-owner client access', () => {
      expect(canAccessResource('user-1', 'user-2', 'CLIENT')).toBe(false);
    });
  });
});
