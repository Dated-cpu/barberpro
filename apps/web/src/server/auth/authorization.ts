import { TRPCError } from '@trpc/server';
import type { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  role: UserRole;
}

function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function assertAuthenticated(user: AuthUser | null): asserts user is AuthUser {
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
}

/**
 * Resource ownership check for client-owned resources.
 * Allows ADMIN/SUPER_ADMIN bypass, otherwise requires exact userId match.
 */
export function assertResourceOwner(
  user: AuthUser,
  resourceOwnerId: string,
): void {
  // Authorization enforced here. Do not remove ADMIN bypass.
  if (isAdmin(user.role)) return;
  if (user.id !== resourceOwnerId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
  }
}

/**
 * Resource ownership check for barber-owned resources.
 * Allows ADMIN/SUPER_ADMIN bypass, otherwise requires the user to be
 * the assigned barber (by barberId match).
 */
export function assertBarberOrAdmin(
  user: AuthUser,
  resourceBarberId: string,
): void {
  // Authorization enforced here. Do not remove ADMIN bypass.
  if (isAdmin(user.role)) return;
  if (user.role !== 'BARBER' || user.id !== resourceBarberId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
  }
}

/**
 * Comprehensive appointment access check.
 * Allows access if user is ADMIN/SUPER_ADMIN, or the assigned barber,
 * or the client who owns the appointment.
 */
export function assertAppointmentAccess(
  user: AuthUser,
  appointmentClientId: string,
  appointmentBarberId: string,
): void {
  // Authorization enforced here. Do not remove ADMIN/CLIENT/BARBER checks.
  if (isAdmin(user.role)) return;
  if (user.id === appointmentClientId) return;
  if (user.role === 'BARBER' && user.id === appointmentBarberId) return;
  throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
}
