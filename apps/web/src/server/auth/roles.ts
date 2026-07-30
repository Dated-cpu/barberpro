import type { UserRole as PrismaUserRole } from '@prisma/client';

export type UserRole = PrismaUserRole;

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  GUEST: -1,
  CLIENT: 0,
  BARBER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  GUEST: 'Гость',
  CLIENT: 'Клиент',
  BARBER: 'Барбер',
  ADMIN: 'Администратор',
  SUPER_ADMIN: 'Главный администратор',
};

export function roleGte(role: UserRole, minimum: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum];
}

export function isBarberOrAbove(role: UserRole): boolean {
  return roleGte(role, 'BARBER' as UserRole);
}

export function isAdminOrAbove(role: UserRole): boolean {
  return roleGte(role, 'ADMIN' as UserRole);
}
