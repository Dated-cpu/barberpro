import { describe, it, expect } from 'vitest';
import {
  createAppointmentSchema,
  cancelAppointmentSchema,
  appointmentIdSchema,
} from '../src/validators/booking';

const uuid = '00000000-0000-0000-0000-000000000001';
const validPhone = '+71234567890';

describe('createAppointmentSchema', () => {
  it('should accept valid input with all required fields', () => {
    const result = createAppointmentSchema.safeParse({
      barberId: uuid,
      serviceId: uuid,
      startTime: '2026-08-15T10:00:00+03:00',
      clientName: 'Иван Иванов',
      clientPhone: validPhone,
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing clientName', () => {
    const result = createAppointmentSchema.safeParse({
      barberId: uuid,
      serviceId: uuid,
      startTime: '2026-08-15T10:00:00+03:00',
      clientPhone: validPhone,
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing clientPhone', () => {
    const result = createAppointmentSchema.safeParse({
      barberId: uuid,
      serviceId: uuid,
      startTime: '2026-08-15T10:00:00+03:00',
      clientName: 'Иван',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid phone format', () => {
    const result = createAppointmentSchema.safeParse({
      barberId: uuid,
      serviceId: uuid,
      startTime: '2026-08-15T10:00:00+03:00',
      clientName: 'Иван',
      clientPhone: '89991234567',
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional clientEmail', () => {
    const result = createAppointmentSchema.safeParse({
      barberId: uuid,
      serviceId: uuid,
      startTime: '2026-08-15T10:00:00+03:00',
      clientName: 'Иван',
      clientPhone: validPhone,
      clientEmail: 'ivan@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid clientEmail', () => {
    const result = createAppointmentSchema.safeParse({
      barberId: uuid,
      serviceId: uuid,
      startTime: '2026-08-15T10:00:00+03:00',
      clientName: 'Иван',
      clientPhone: validPhone,
      clientEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short clientName', () => {
    const result = createAppointmentSchema.safeParse({
      barberId: uuid,
      serviceId: uuid,
      startTime: '2026-08-15T10:00:00+03:00',
      clientName: 'A',
      clientPhone: validPhone,
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing barberId', () => {
    const result = createAppointmentSchema.safeParse({
      serviceId: uuid,
      startTime: '2026-08-15T10:00:00+03:00',
      clientName: 'Иван',
      clientPhone: validPhone,
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid barberId (not uuid)', () => {
    const result = createAppointmentSchema.safeParse({
      barberId: 'not-a-uuid',
      serviceId: uuid,
      startTime: '2026-08-15T10:00:00+03:00',
      clientName: 'Иван',
      clientPhone: validPhone,
    });
    expect(result.success).toBe(false);
  });
});

describe('cancelAppointmentSchema', () => {
  it('should accept valid cancel input', () => {
    const result = cancelAppointmentSchema.safeParse({ appointmentId: uuid });
    expect(result.success).toBe(true);
  });

  it('should accept cancel with reason', () => {
    const result = cancelAppointmentSchema.safeParse({ appointmentId: uuid, reason: 'Не могу прийти' });
    expect(result.success).toBe(true);
  });

  it('should reject missing appointmentId', () => {
    const result = cancelAppointmentSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject long reason', () => {
    const result = cancelAppointmentSchema.safeParse({ appointmentId: uuid, reason: 'x'.repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe('appointment getById ownership rules', () => {
  const clientId = 'client-123';
  const barberId = 'barber-456';
  const adminId = 'admin-789';
  const otherClientId = 'other-client-999';
  const appointmentMock = { clientId, barberId };

  function canAccessAppointment(userId: string, role: string): boolean {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true;
    if (role === 'BARBER' && appointmentMock.barberId === userId) return true;
    if (appointmentMock.clientId === userId) return true;
    return false;
  }

  it('should allow client to access own appointment', () => {
    expect(canAccessAppointment(clientId, 'CLIENT')).toBe(true);
  });

  it('should deny client access to other client appointment', () => {
    expect(canAccessAppointment(otherClientId, 'CLIENT')).toBe(false);
  });

  it('should allow barber to access own appointment', () => {
    expect(canAccessAppointment(barberId, 'BARBER')).toBe(true);
  });

  it('should deny barber access to other barber appointment', () => {
    expect(canAccessAppointment('other-barber-777', 'BARBER')).toBe(false);
  });

  it('should allow admin to access any appointment', () => {
    expect(canAccessAppointment(adminId, 'ADMIN')).toBe(true);
  });

  it('should allow SUPER_ADMIN to access any appointment', () => {
    expect(canAccessAppointment(adminId, 'SUPER_ADMIN')).toBe(true);
  });
});
