import type { UserRole } from '@prisma/client';

export function isValidRole(role: string, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(role as UserRole);
}

export function canAccessResource(userId: string, resourceOwnerId: string, userRole: UserRole): boolean {
  if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') return true;
  return userId === resourceOwnerId;
}
