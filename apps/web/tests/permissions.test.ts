import { describe, it, expect } from 'vitest';
import { isValidRole, canAccessResource } from '../src/trpc/middleware/auth';
import { updateProfileSchema, createBlockedSlotSchema } from '../src/validators/settings';

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

    it('should accept barber in barber procedures', () => {
      expect(isValidRole('BARBER', ['BARBER', 'ADMIN', 'SUPER_ADMIN'])).toBe(true);
    });

    it('should reject client in barber procedures', () => {
      expect(isValidRole('CLIENT', ['BARBER', 'ADMIN', 'SUPER_ADMIN'])).toBe(false);
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

  describe('Barber settings procedures', () => {
    it('should accept valid updateProfileSchema', () => {
      expect(updateProfileSchema.safeParse({ firstName: 'John', lastName: 'Doe', phone: '+71234567890' }).success).toBe(true);
    });

    it('should accept minimal updateProfileSchema', () => {
      expect(updateProfileSchema.safeParse({ firstName: 'John' }).success).toBe(true);
    });

    it('should reject updateProfileSchema with short name', () => {
      expect(updateProfileSchema.safeParse({ firstName: 'J' }).success).toBe(false);
    });

    it('should accept createBlockedSlotSchema with reason', () => {
      expect(createBlockedSlotSchema.safeParse({ startTime: '2026-07-26T10:00:00Z', endTime: '2026-07-26T12:00:00Z', reason: 'Lunch' }).success).toBe(true);
    });
  });
});
