import { describe, it, expect } from 'vitest';
import { assertResourceOwner } from '../src/server/auth/authorization';
import { hasPermission } from '../src/server/auth/permissions';
import { Permission } from '../src/server/auth/permissions';
import { updateProfileSchema, createBlockedSlotSchema } from '../src/validators/settings';

const adminUser = { id: 'admin-1', role: 'ADMIN' as const };
const superAdminUser = { id: 'super-admin-1', role: 'SUPER_ADMIN' as const };
const barberUser = { id: 'barber-1', role: 'BARBER' as const };
const clientUser = { id: 'client-1', role: 'CLIENT' as const };

describe('Permissions', () => {
  describe('hasPermission', () => {
    it('should allow ADMIN to access admin resources', () => {
      expect(hasPermission(adminUser.role, Permission.ADMIN_PANEL)).toBe(true);
      expect(hasPermission(adminUser.role, Permission.APPOINTMENT_LIST_ALL)).toBe(true);
    });

    it('should allow SUPER_ADMIN to access admin resources', () => {
      expect(hasPermission(superAdminUser.role, Permission.ADMIN_PANEL)).toBe(true);
      expect(hasPermission(superAdminUser.role, Permission.APPOINTMENT_LIST_ALL)).toBe(true);
    });

    it('should deny CLIENT access to admin resources', () => {
      expect(hasPermission(clientUser.role, Permission.ADMIN_PANEL)).toBe(false);
      expect(hasPermission(clientUser.role, Permission.APPOINTMENT_LIST_ALL)).toBe(false);
    });

    it('should deny BARBER access to admin-only resources', () => {
      expect(hasPermission(barberUser.role, Permission.ADMIN_PANEL)).toBe(false);
      expect(hasPermission(barberUser.role, Permission.APPOINTMENT_LIST_ALL)).toBe(false);
    });

    it('should allow BARBER to access barber resources', () => {
      expect(hasPermission(barberUser.role, Permission.DASHBOARD_VIEW)).toBe(true);
      expect(hasPermission(barberUser.role, Permission.APPOINTMENT_CONFIRM)).toBe(true);
      expect(hasPermission(barberUser.role, Permission.APPOINTMENT_COMPLETE)).toBe(true);
    });

    it('should deny CLIENT access to barber resources', () => {
      expect(hasPermission(clientUser.role, Permission.DASHBOARD_VIEW)).toBe(false);
      expect(hasPermission(clientUser.role, Permission.APPOINTMENT_CONFIRM)).toBe(false);
    });

    it('should allow CLIENT to access own resources', () => {
      expect(hasPermission(clientUser.role, Permission.APPOINTMENT_CREATE)).toBe(true);
      expect(hasPermission(clientUser.role, Permission.APPOINTMENT_CANCEL)).toBe(true);
    });
  });

  describe('assertResourceOwner', () => {
    it('should allow admin to access any resource', () => {
      expect(() => assertResourceOwner(adminUser, 'client-1')).not.toThrow();
    });

    it('should allow super admin to access any resource', () => {
      expect(() => assertResourceOwner(superAdminUser, 'client-1')).not.toThrow();
    });

    it('should allow owner to access own resource', () => {
      expect(() => assertResourceOwner(clientUser, 'client-1')).not.toThrow();
    });

    it('should deny non-owner client access', () => {
      expect(() => assertResourceOwner(clientUser, 'user-2')).toThrow('Access denied');
    });

    it('should deny non-owner barber access', () => {
      expect(() => assertResourceOwner(barberUser, 'client-1')).toThrow('Access denied');
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
