'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const loginMut = trpc.auth.login.useMutation({
    onSuccess: () => {
      addToast('Вход выполнен успешно', 'success');
      router.push('/dashboard');
    },
    onError: (err) => {
      addToast(err.message, 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMut.mutate({ login, password });
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
          <Button type="submit" loading={loginMut.isPending} className="mt-2">
            Войти
          </Button>
        </form>
      </div>
    </div>
  );
}
