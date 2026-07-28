'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionTitle } from '@/components/shared/section-title';
import { authStorage } from '@/lib/auth-storage';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ login: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      authStorage.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      router.push('/profile');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.login || !form.password) {
      setError('Заполните все поля');
      return;
    }
    loginMutation.mutate({ ...form, rememberMe });
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-16 sm:py-20">
      <div className="w-full max-w-md px-4 sm:px-6">
        <SectionTitle
          title="Вход"
          subtitle="Добро пожаловать в BarberPro"
          className="mb-8"
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="login"
            label="Email или телефон"
            placeholder="email@example.com или +7 (999) 123-45-67"
            value={form.login}
            onChange={(e) => setForm({ ...form, login: e.target.value })}
          />
          <Input
            id="password"
            label="Пароль"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
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

          {error ? <p className="text-xs text-error font-body">{error}</p> : null}

          <Button type="submit" className="mt-2 w-full" loading={loginMutation.isPending}>
            Войти
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
