'use client';

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { trpc } from '@/trpc/client';
import type { AuthUser } from '@/types/auth';

interface AuthContextValue {
  /** Авторизованный пользователь; `undefined` пока идёт первая загрузка */
  user: AuthUser | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  isError: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const utils = trpc.useUtils();
  const refreshAttempted = useRef(false);

  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
    gcTime: Infinity,
  });

  const refreshMutation = trpc.auth.refresh.useMutation();

  // Единственная точка восстановления сессии: после любой ошибки auth.me
  // пробуем обновить токены через существующий auth.refresh и перечитать профиль.
  useEffect(() => {
    if (isError && !refreshAttempted.current) {
      refreshAttempted.current = true;
      refreshMutation.mutate(undefined, {
        onSuccess: () => {
          utils.auth.me.invalidate();
        },
        onError: () => {},
      });
    }
  }, [isError, refreshMutation, utils]);

  // После успешного логина / получения пользователя снова разрешаем попытку refresh
  useEffect(() => {
    if (user) {
      refreshAttempted.current = false;
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        isError,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useCurrentUser(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useCurrentUser must be used within AuthProvider');
  return ctx;
}
