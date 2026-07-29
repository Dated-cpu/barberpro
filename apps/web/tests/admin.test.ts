import { describe, it, expect } from 'vitest';
import { isValidRole, canAccessResource } from '../src/trpc/middleware/auth';
import { updateAppointmentStatusSchema, rescheduleAppointmentSchema, completeAppointmentSchema } from '../src/validators/booking';
import { moderateReviewSchema } from '../src/validators/reviews';
import { z } from 'zod';

const uuid = '00000000-0000-0000-0000-000000000001';

const listAllUsersSchema = z.object({
  search: z.string().max(100).optional(),
  role: z.enum(['ADMIN', 'BARBER', 'CLIENT']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
});

const updateUserSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  role: z.enum(['CLIENT', 'BARBER', 'ADMIN']).optional(),
});

const adminDeleteReviewSchema = z.object({
  reviewId: z.string().uuid(),
});

const auditExportSchema = z.object({
  action: z.string().optional(),
  entityType: z.string().optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

describe('Admin permission rules', () => {
  it('should allow ADMIN to access admin resources', () => {
    expect(isValidRole('ADMIN', ['ADMIN', 'SUPER_ADMIN'])).toBe(true);
    expect(canAccessResource('admin-1', uuid, 'ADMIN')).toBe(true);
  });

  it('should allow SUPER_ADMIN to access admin resources', () => {
    expect(isValidRole('SUPER_ADMIN', ['ADMIN', 'SUPER_ADMIN'])).toBe(true);
    expect(canAccessResource('super-admin-1', uuid, 'SUPER_ADMIN')).toBe(true);
  });

  it('should deny CLIENT access to admin resources', () => {
    expect(isValidRole('CLIENT', ['ADMIN', 'SUPER_ADMIN'])).toBe(false);
  });

  it('should deny BARBER access to admin resources', () => {
    expect(isValidRole('BARBER', ['ADMIN', 'SUPER_ADMIN'])).toBe(false);
  });
});

describe('Admin endpoint input validation', () => {
  describe('listAllUsers', () => {
    it('should accept empty input (defaults)', () => {
      const result = listAllUsersSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.limit).toBe(50);
    });

    it('should accept valid role filter', () => {
      expect(listAllUsersSchema.safeParse({ role: 'BARBER' }).success).toBe(true);
      expect(listAllUsersSchema.safeParse({ role: 'CLIENT' }).success).toBe(true);
      expect(listAllUsersSchema.safeParse({ role: 'ADMIN' }).success).toBe(true);
    });

    it('should reject invalid role', () => {
      expect(listAllUsersSchema.safeParse({ role: 'SUPER_ADMIN' }).success).toBe(false);
    });

    it('should accept search query', () => {
      expect(listAllUsersSchema.safeParse({ search: 'Alex' }).success).toBe(true);
    });

    it('should reject too long search', () => {
      expect(listAllUsersSchema.safeParse({ search: 'x'.repeat(101) }).success).toBe(false);
    });

    it('should accept cursor', () => {
      expect(listAllUsersSchema.safeParse({ cursor: uuid }).success).toBe(true);
    });

    it('should reject invalid cursor', () => {
      expect(listAllUsersSchema.safeParse({ cursor: 'not-uuid' }).success).toBe(false);
    });
  });

  describe('updateUser', () => {
    it('should accept valid update with all fields', () => {
      expect(updateUserSchema.safeParse({
        id: uuid, firstName: 'John', lastName: 'Doe',
        email: 'john@example.com', phone: '+71234567890',
        isActive: true, role: 'BARBER',
      }).success).toBe(true);
    });

    it('should accept update with just role', () => {
      expect(updateUserSchema.safeParse({ id: uuid, role: 'ADMIN' }).success).toBe(true);
    });

    it('should reject update without id', () => {
      expect(updateUserSchema.safeParse({ firstName: 'John' }).success).toBe(false);
    });

    it('should reject invalid id', () => {
      expect(updateUserSchema.safeParse({ id: 'bad-id' }).success).toBe(false);
    });

    it('should reject invalid email', () => {
      expect(updateUserSchema.safeParse({ id: uuid, email: 'not-email' }).success).toBe(false);
    });

    it('should reject short firstName', () => {
      expect(updateUserSchema.safeParse({ id: uuid, firstName: 'A' }).success).toBe(false);
    });

    it('should reject invalid role', () => {
      expect(updateUserSchema.safeParse({ id: uuid, role: 'SUPER_ADMIN' }).success).toBe(false);
    });
  });

  describe('adminDeleteReview', () => {
    it('should accept valid review id', () => {
      expect(adminDeleteReviewSchema.safeParse({ reviewId: uuid }).success).toBe(true);
    });

    it('should reject missing reviewId', () => {
      expect(adminDeleteReviewSchema.safeParse({}).success).toBe(false);
    });

    it('should reject invalid uuid', () => {
      expect(adminDeleteReviewSchema.safeParse({ reviewId: 'bad' }).success).toBe(false);
    });
  });

  describe('auditExport', () => {
    it('should accept empty export', () => {
      expect(auditExportSchema.safeParse({}).success).toBe(true);
    });

    it('should accept with action filter', () => {
      expect(auditExportSchema.safeParse({ action: 'LOGIN' }).success).toBe(true);
    });

    it('should accept with entityType', () => {
      expect(auditExportSchema.safeParse({ entityType: 'USER' }).success).toBe(true);
    });

    it('should accept with date range', () => {
      expect(auditExportSchema.safeParse({
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-12-31T23:59:59.000Z',
      }).success).toBe(true);
    });

    it('should reject bad datetime format', () => {
      expect(auditExportSchema.safeParse({ from: '2026-01-01' }).success).toBe(false);
    });
  });
});

describe('Admin appointment actions validation', () => {
  describe('updateAppointmentStatusSchema', () => {
    it('should accept valid status change', () => {
      expect(updateAppointmentStatusSchema.safeParse({
        id: uuid, status: 'COMPLETED',
      }).success).toBe(true);
    });

    it('should accept status change with notes', () => {
      expect(updateAppointmentStatusSchema.safeParse({
        id: uuid, status: 'CANCELLED', notes: 'Client cancelled',
      }).success).toBe(true);
    });

    it('should reject invalid status', () => {
      expect(updateAppointmentStatusSchema.safeParse({
        id: uuid, status: 'INVALID',
      }).success).toBe(false);
    });

    it('should reject missing id', () => {
      expect(updateAppointmentStatusSchema.safeParse({
        status: 'COMPLETED',
      }).success).toBe(false);
    });

    it('should reject too long notes', () => {
      expect(updateAppointmentStatusSchema.safeParse({
        id: uuid, status: 'COMPLETED', notes: 'x'.repeat(1001),
      }).success).toBe(false);
    });
  });

  describe('rescheduleAppointmentSchema', () => {
    it('should accept valid reschedule', () => {
      expect(rescheduleAppointmentSchema.safeParse({
        id: uuid,
        startTime: '2026-08-15T14:00:00+03:00',
      }).success).toBe(true);
    });

    it('should reject missing startTime', () => {
      expect(rescheduleAppointmentSchema.safeParse({ id: uuid }).success).toBe(false);
    });
  });

  describe('completeAppointmentSchema', () => {
    it('should accept valid complete', () => {
      expect(completeAppointmentSchema.safeParse({ appointmentId: uuid }).success).toBe(true);
    });

    it('should accept with notes', () => {
      expect(completeAppointmentSchema.safeParse({
        appointmentId: uuid, notes: 'Great haircut',
      }).success).toBe(true);
    });

    it('should reject missing appointmentId', () => {
      expect(completeAppointmentSchema.safeParse({ notes: 'ok' }).success).toBe(false);
    });
  });

  describe('moderateReviewSchema', () => {
    it('should accept moderate review', () => {
      expect(moderateReviewSchema.safeParse({ reviewId: uuid, status: 'APPROVED' }).success).toBe(true);
    });

    it('should reject invalid status', () => {
      expect(moderateReviewSchema.safeParse({ reviewId: uuid, status: 'INVALID' }).success).toBe(false);
    });
  });
});
