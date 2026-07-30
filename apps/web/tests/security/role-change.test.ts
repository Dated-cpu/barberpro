import { describe, it, expect, vi } from 'vitest';
import { Permission, hasPermission } from '../../src/server/auth/permissions';
import { AuditEvent } from '../../src/server/security/audit/events';

const mockTx = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
};

vi.mock('../../src/server/db/helpers', () => ({
  transaction: <T>(fn: (tx: unknown) => Promise<T>) => fn(mockTx),
}));

vi.mock('../../src/server/services/audit', () => ({
  auditService: {
    log: vi.fn(),
  },
}));

describe('Role change', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow ADMIN to change user role', () => {
    expect(hasPermission('ADMIN' as const, Permission.USER_UPDATE)).toBe(true);
  });

  it('should not allow CLIENT to change user role', () => {
    expect(hasPermission('CLIENT' as const, Permission.USER_LIST)).toBe(false);
  });

  it('should allow ADMIN to change user role', () => {
    expect(hasPermission('ADMIN' as const, Permission.USER_UPDATE)).toBe(true);
  });

  it('should update roleChangedAt and roleChangedBy on role change', async () => {
    const { adminService } = await import('../../src/server/services/admin');

    mockTx.user.findUnique.mockResolvedValue({
      id: 'target-1',
      role: 'CLIENT',
      deletedAt: null,
    });

    mockTx.user.update.mockResolvedValue({
      id: 'target-1',
      role: 'BARBER',
      roleChangedAt: new Date(),
      roleChangedBy: 'admin-1',
    });

    const result = await adminService.updateUserRole('admin-1', 'target-1', 'BARBER');

    expect(mockTx.user.update).toHaveBeenCalledWith({
      where: { id: 'target-1' },
      data: expect.objectContaining({
        role: 'BARBER',
        roleChangedAt: expect.any(Date),
        roleChangedBy: 'admin-1',
      }),
    });

    expect(result.role).toBe('BARBER');
  });

  it('should skip update when role is unchanged', async () => {
    const { adminService } = await import('../../src/server/services/admin');

    mockTx.user.findUnique.mockResolvedValue({
      id: 'target-1',
      role: 'BARBER',
      deletedAt: null,
    });

    const result = await adminService.updateUserRole('admin-1', 'target-1', 'BARBER');

    expect(mockTx.user.update).not.toHaveBeenCalled();
    expect(result.role).toBe('BARBER');
  });

  it('should throw NOT_FOUND for nonexistent user', async () => {
    const { adminService } = await import('../../src/server/services/admin');

    mockTx.user.findUnique.mockResolvedValue(null);

    await expect(adminService.updateUserRole('admin-1', 'nonexistent', 'BARBER')).rejects.toThrow('User not found');
  });

  it('should have ROLE_CHANGED in AuditEvent', () => {
    expect(AuditEvent.ROLE_CHANGED).toBe('admin.role.changed');
  });
});
