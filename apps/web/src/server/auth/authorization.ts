import { TRPCError } from '@trpc/server';
import type { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  role: UserRole;
}

export function assertAuthenticated(user: AuthUser | null): asserts user is AuthUser {
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
}

export function assertResourceOwner(
  user: AuthUser,
  resourceOwnerId: string,
): void {
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  if (isAdmin) return;
  if (user.id !== resourceOwnerId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
  }
}


