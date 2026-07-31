'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

function getRedirectPath(role: string): string {
  switch (role) {
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin';
    case 'BARBER':
      return '/barber';
    default:
      return '/';
  }
}

export default function LoginPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { addToast } = useToast();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const loginMut = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      addToast('Вход выполнен успешно', 'success');
      utils.auth.me.invalidate();
      setTimeout(() => router.replace(getRedirectPath(data.user.role)), 200);
    },
    onError: (err) => {
      const msg = err.message === 'Invalid credentials'
        ? 'Неверный email/телефон или пароль'
        : err.message === 'Account is deactivated'
        ? 'Аккаунт деактивирован'
        : err.message;
      setError(msg);
    },
  });

  const isPending = loginMut.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!login || !password) {
      setError('Заполните все поля');
      return;
    }
    loginMut.mutate({ login, password, rememberMe });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-display text-3xl font-bold text-text-primary">
            BARBER<span className="text-accent">PRO</span>
          </h1>
          <p className="text-sm text-text-secondary font-body">Вход в личный кабинет</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="login"
            label="Email или телефон"
            type="text"
            placeholder="admin@barberpro.ru"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />
          <Input
            id="password"
            label="Пароль"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-bg-secondary text-accent cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-text-secondary font-body">Запомнить меня</span>
            </label>
            <Link href="/auth/forgot-password" className="text-xs sm:text-sm text-accent hover:underline font-body">
              Забыли пароль?
            </Link>
          </div>

          {error ? (
            <div className="rounded-lg border border-error/30 bg-error-bg px-4 py-2.5">
              <p className="text-xs text-error font-body">{error}</p>
            </div>
          ) : null}

          <Button type="submit" loading={isPending} className="mt-2">
            {isPending ? 'Выполняется вход...' : 'Войти'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs sm:text-sm text-text-tertiary font-body">
          Нет аккаунта?{' '}
          <Link href="/auth/register" className="text-accent hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
