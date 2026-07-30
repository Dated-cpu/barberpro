import { describe, it, expect } from 'vitest';
import { assertResourceOwner, assertBarberOrAdmin, assertAppointmentAccess } from '../src/server/auth/authorization';
import { hasPermission } from '../src/server/auth/permissions';
import { Permission } from '../src/server/auth/permissions';
import { updateAppointmentStatusSchema, rescheduleAppointmentSchema, completeAppointmentSchema } from '../src/validators/booking';
import { moderateReviewSchema } from '../src/validators/reviews';

const adminUser = { id: 'admin-1', role: 'ADMIN' as const };
const superAdminUser = { id: 'super-admin-1', role: 'SUPER_ADMIN' as const };
const barberUser = { id: 'barber-1', role: 'BARBER' as const };
const clientUser = { id: 'client-1', role: 'CLIENT' as const };

const resourceId = '00000000-0000-0000-0000-000000000001';

describe('Admin permission rules', () => {
  it('should allow ADMIN to access admin panel', () => {
    expect(hasPermission(adminUser.role, Permission.ADMIN_PANEL)).toBe(true);
  });

  it('should allow SUPER_ADMIN to access admin panel', () => {
    expect(hasPermission(superAdminUser.role, Permission.ADMIN_PANEL)).toBe(true);
  });

  it('should deny CLIENT access to admin panel', () => {
    expect(hasPermission(clientUser.role, Permission.ADMIN_PANEL)).toBe(false);
  });

  it('should deny BARBER access to admin panel', () => {
    expect(hasPermission(barberUser.role, Permission.ADMIN_PANEL)).toBe(false);
  });

  it('should allow ADMIN to access any resource via assertResourceOwner', () => {
    expect(() => assertResourceOwner(adminUser, resourceId)).not.toThrow();
  });

  it('should allow SUPER_ADMIN to access any resource via assertResourceOwner', () => {
    expect(() => assertResourceOwner(superAdminUser, resourceId)).not.toThrow();
  });
});

describe('Admin appointment actions validation', () => {
  describe('updateAppointmentStatusSchema', () => {
    it('should accept valid status change', () => {
      expect(updateAppointmentStatusSchema.safeParse({
        id: resourceId, status: 'COMPLETED',
      }).success).toBe(true);
    });

    it('should accept status change with notes', () => {
      expect(updateAppointmentStatusSchema.safeParse({
        id: resourceId, status: 'CANCELLED', notes: 'Client cancelled',
      }).success).toBe(true);
    });

    it('should reject invalid status', () => {
      expect(updateAppointmentStatusSchema.safeParse({
        id: resourceId, status: 'INVALID',
      }).success).toBe(false);
    });

    it('should reject missing id', () => {
      expect(updateAppointmentStatusSchema.safeParse({
        status: 'COMPLETED',
      }).success).toBe(false);
    });

    it('should reject too long notes', () => {
      expect(updateAppointmentStatusSchema.safeParse({
        id: resourceId, status: 'COMPLETED', notes: 'x'.repeat(1001),
      }).success).toBe(false);
    });
  });

  describe('rescheduleAppointmentSchema', () => {
    it('should accept valid reschedule', () => {
      expect(rescheduleAppointmentSchema.safeParse({
        id: resourceId,
        startTime: '2026-08-15T14:00:00+03:00',
      }).success).toBe(true);
    });

    it('should reject missing startTime', () => {
      expect(rescheduleAppointmentSchema.safeParse({ id: resourceId }).success).toBe(false);
    });
  });

  describe('completeAppointmentSchema', () => {
    it('should accept valid complete', () => {
      expect(completeAppointmentSchema.safeParse({ appointmentId: resourceId }).success).toBe(true);
    });

    it('should accept with notes', () => {
      expect(completeAppointmentSchema.safeParse({
        appointmentId: resourceId, notes: 'Great haircut',
      }).success).toBe(true);
    });

    it('should reject missing appointmentId', () => {
      expect(completeAppointmentSchema.safeParse({ notes: 'ok' }).success).toBe(false);
    });
  });

  describe('moderateReviewSchema', () => {
    it('should accept moderate review', () => {
      expect(moderateReviewSchema.safeParse({ reviewId: resourceId, status: 'APPROVED' }).success).toBe(true);
    });

    it('should reject invalid status', () => {
      expect(moderateReviewSchema.safeParse({ reviewId: resourceId, status: 'INVALID' }).success).toBe(false);
    });
  });
});
