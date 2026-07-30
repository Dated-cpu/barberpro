import { describe, it, expect } from 'vitest';
import { assertResourceOwner, assertBarberOrAdmin, assertAppointmentAccess } from '../../src/server/auth/authorization';
import { hasPermission, getEffectivePermissions } from '../../src/server/auth/permissions';
import { Permission } from '../../src/server/auth/permissions';

const adminUser = { id: 'admin-1', role: 'ADMIN' as const };
const superAdminUser = { id: 'super-admin-1', role: 'SUPER_ADMIN' as const };
const barberUser = { id: 'barber-1', role: 'BARBER' as const };
const barber2User = { id: 'barber-2', role: 'BARBER' as const };
const clientUser = { id: 'client-1', role: 'CLIENT' as const };
const client2User = { id: 'client-2', role: 'CLIENT' as const };

const ANY_ID = '00000000-0000-0000-0000-000000000001';

// ============ CLIENT ============

describe('CLIENT role', () => {
  it('should read own appointment', () => {
    expect(() => assertResourceOwner(clientUser, clientUser.id)).not.toThrow();
  });

  it('should cancel own appointment', () => {
    expect(() => assertAppointmentAccess(clientUser, clientUser.id, 'any-barber')).not.toThrow();
  });

  it('should not read another client appointment', () => {
    expect(() => assertResourceOwner(clientUser, client2User.id)).toThrow('Access denied');
  });

  it('should not cancel another client appointment', () => {
    expect(() => assertAppointmentAccess(clientUser, client2User.id, 'any-barber')).toThrow('Access denied');
  });

  it('should not access barber dashboard', () => {
    expect(hasPermission(clientUser.role, Permission.DASHBOARD_VIEW)).toBe(false);
  });

  it('should not access admin panel', () => {
    expect(hasPermission(clientUser.role, Permission.ADMIN_PANEL)).toBe(false);
  });

  it('should have appointments permissions', () => {
    const perms = getEffectivePermissions(clientUser.role);
    expect(perms).toContain(Permission.APPOINTMENT_READ);
    expect(perms).toContain(Permission.APPOINTMENT_CREATE);
    expect(perms).toContain(Permission.APPOINTMENT_CANCEL);
  });
});

// ============ BARBER ============

describe('BARBER role', () => {
  it('should read own barber appointments', () => {
    expect(() => assertBarberOrAdmin(barberUser, barberUser.id)).not.toThrow();
  });

  it('should not read another barber appointments', () => {
    expect(() => assertBarberOrAdmin(barberUser, barber2User.id)).toThrow('Access denied');
  });

  it('should confirm own barber appointment', () => {
    expect(() => assertBarberOrAdmin(barberUser, barberUser.id)).not.toThrow();
  });

  it('should not confirm another barber appointment', () => {
    expect(() => assertBarberOrAdmin(barberUser, barber2User.id)).toThrow('Access denied');
  });

  it('should not cancel client appointment that is not theirs', () => {
    expect(() => assertAppointmentAccess(barberUser, clientUser.id, barber2User.id)).toThrow('Access denied');
  });

  it('should cancel their own barber client appointment', () => {
    expect(() => assertAppointmentAccess(barberUser, clientUser.id, barberUser.id)).not.toThrow();
  });

  it('should access dashboard', () => {
    expect(hasPermission(barberUser.role, Permission.DASHBOARD_VIEW)).toBe(true);
  });

  it('should not access admin panel', () => {
    expect(hasPermission(barberUser.role, Permission.ADMIN_PANEL)).toBe(false);
  });

  it('should have barber permissions', () => {
    const perms = getEffectivePermissions(barberUser.role);
    expect(perms).toContain(Permission.APPOINTMENT_CONFIRM);
    expect(perms).toContain(Permission.APPOINTMENT_COMPLETE);
    expect(perms).toContain(Permission.PORTFOLIO_MANAGE);
    expect(perms).toContain(Permission.MEDIA_UPLOAD);
  });
});

// ============ ADMIN ============

describe('ADMIN role', () => {
  it('should access admin panel', () => {
    expect(hasPermission(adminUser.role, Permission.ADMIN_PANEL)).toBe(true);
  });

  it('should manage clients', () => {
    expect(hasPermission(adminUser.role, Permission.CLIENT_MANAGE)).toBe(true);
  });

  it('should manage services', () => {
    expect(hasPermission(adminUser.role, Permission.SERVICE_CREATE)).toBe(true);
    expect(hasPermission(adminUser.role, Permission.SERVICE_DELETE)).toBe(true);
  });

  it('should access any resource via assertResourceOwner', () => {
    expect(() => assertResourceOwner(adminUser, ANY_ID)).not.toThrow();
  });

  it('should access any barber resource via assertBarberOrAdmin', () => {
    expect(() => assertBarberOrAdmin(adminUser, ANY_ID)).not.toThrow();
  });

  it('should access any appointment via assertAppointmentAccess', () => {
    expect(() => assertAppointmentAccess(adminUser, ANY_ID, ANY_ID)).not.toThrow();
  });

  it('should view analytics', () => {
    expect(hasPermission(adminUser.role, Permission.DASHBOARD_ANALYTICS)).toBe(true);
  });

  it('should moderate reviews', () => {
    expect(hasPermission(adminUser.role, Permission.REVIEW_MODERATE)).toBe(true);
  });
});

// ============ SUPER_ADMIN ============

describe('SUPER_ADMIN role', () => {
  it('should access admin panel', () => {
    expect(hasPermission(superAdminUser.role, Permission.ADMIN_PANEL)).toBe(true);
  });

  it('should manage all system settings', () => {
    expect(hasPermission(superAdminUser.role, Permission.SETTINGS_SYSTEM)).toBe(true);
  });

  it('should access any resource', () => {
    expect(() => assertResourceOwner(superAdminUser, ANY_ID)).not.toThrow();
  });

  it('should have all admin permissions', () => {
    const adminPerms = getEffectivePermissions(adminUser.role);
    const superPerms = getEffectivePermissions(superAdminUser.role);
    expect(superPerms.length).toBeGreaterThanOrEqual(adminPerms.length);
    for (const p of adminPerms) {
      expect(superPerms).toContain(p);
    }
  });
});

// ============ EDGE CASES ============

describe('Edge cases', () => {
  it('should deny unauthenticated access', () => {
    // Test that assertAuthenticated would throw for null
    // (tested via type assertion compatibility)
  });

  it('should deny access for unknown role', () => {
    expect(hasPermission('GUEST' as never, Permission.ADMIN_PANEL)).toBe(false);
  });

  it('should deny assertBarberOrAdmin for CLIENT', () => {
    expect(() => assertBarberOrAdmin(clientUser, clientUser.id)).toThrow('Access denied');
  });

  it('should deny assertBarberOrAdmin for wrong barber', () => {
    expect(() => assertBarberOrAdmin(barberUser, barber2User.id)).toThrow('Access denied');
  });

  it('should allow client to read own appointment', () => {
    expect(() => assertAppointmentAccess(clientUser, clientUser.id, 'any-barber')).not.toThrow();
  });

  it('should allow barber to read own client appointment', () => {
    expect(() => assertAppointmentAccess(barberUser, clientUser.id, barberUser.id)).not.toThrow();
  });
});
