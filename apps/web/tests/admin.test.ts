import { describe, it, expect } from 'vitest';
import { isValidRole, canAccessResource } from '../src/trpc/middleware/auth';
import { updateAppointmentStatusSchema, rescheduleAppointmentSchema, completeAppointmentSchema } from '../src/validators/booking';
import { moderateReviewSchema } from '../src/validators/reviews';

const uuid = '00000000-0000-0000-0000-000000000001';

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
