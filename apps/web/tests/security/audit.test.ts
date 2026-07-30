import { describe, it, expect } from 'vitest';
import { Permission, hasPermission, getEffectivePermissions } from '../../src/server/auth/permissions';
import { AuditEvent } from '../../src/server/security/audit/events';

const adminRole = 'ADMIN' as const;
const superAdminRole = 'SUPER_ADMIN' as const;
const barberRole = 'BARBER' as const;
const clientRole = 'CLIENT' as const;

describe('AUDIT_VIEW permission', () => {
  it('should be granted to ADMIN', () => {
    expect(hasPermission(adminRole, Permission.AUDIT_VIEW)).toBe(true);
  });

  it('should be granted to SUPER_ADMIN', () => {
    expect(hasPermission(superAdminRole, Permission.AUDIT_VIEW)).toBe(true);
  });

  it('should NOT be granted to BARBER', () => {
    expect(hasPermission(barberRole, Permission.AUDIT_VIEW)).toBe(false);
  });

  it('should NOT be granted to CLIENT', () => {
    expect(hasPermission(clientRole, Permission.AUDIT_VIEW)).toBe(false);
  });

  it('ADMIN effective permissions should include AUDIT_VIEW', () => {
    const perms = getEffectivePermissions(adminRole);
    expect(perms).toContain(Permission.AUDIT_VIEW);
  });

  it('SUPER_ADMIN effective permissions should include AUDIT_VIEW', () => {
    const perms = getEffectivePermissions(superAdminRole);
    expect(perms).toContain(Permission.AUDIT_VIEW);
  });
});

describe('AuditEvent constants', () => {
  it('should have LOGIN_SUCCESS', () => {
    expect(AuditEvent.LOGIN_SUCCESS).toBe('auth.login.success');
  });

  it('should have LOGIN_FAILED', () => {
    expect(AuditEvent.LOGIN_FAILED).toBe('auth.login.failed');
  });

  it('should have TOKEN_REUSE_DETECTED', () => {
    expect(AuditEvent.TOKEN_REUSE_DETECTED).toBe('auth.token.reuse_detected');
  });

  it('should have ROLE_CHANGED', () => {
    expect(AuditEvent.ROLE_CHANGED).toBe('admin.role.changed');
  });

  it('should have PASSWORD_CHANGED', () => {
    expect(AuditEvent.PASSWORD_CHANGED).toBe('auth.password.changed');
  });

  it('should have PASSWORD_RESET', () => {
    expect(AuditEvent.PASSWORD_RESET).toBe('auth.password.reset');
  });

  it('should have all appointment events', () => {
    expect(AuditEvent.APPOINTMENT_CREATED).toBe('appointment.created');
    expect(AuditEvent.APPOINTMENT_CONFIRMED).toBe('appointment.confirmed');
    expect(AuditEvent.APPOINTMENT_CANCELLED).toBe('appointment.cancelled');
    expect(AuditEvent.APPOINTMENT_COMPLETED).toBe('appointment.completed');
    expect(AuditEvent.APPOINTMENT_STATUS_CHANGED).toBe('appointment.status_changed');
    expect(AuditEvent.APPOINTMENT_RESCHEDULED).toBe('appointment.rescheduled');
    expect(AuditEvent.APPOINTMENT_NO_SHOW).toBe('appointment.no_show');
  });

  it('should have all 23 unique values', () => {
    const values = Object.values(AuditEvent);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
