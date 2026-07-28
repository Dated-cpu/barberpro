'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionTitle } from '@/components/shared/section-title';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => router.push('/auth/login?reset=success'),
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password || password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }
    if (!token) {
      setError('Отсутствует токен сброса');
      return;
    }
    resetMutation.mutate({ token, password });
  };

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-16 sm:py-20">
        <div className="w-full max-w-md px-4 sm:px-6 text-center">
          <SectionTitle title="Недействительная ссылка" subtitle="Ссылка для сброса пароля отсутствует или истекла" className="mb-6" />
          <Link href="/auth/forgot-password">
            <Button variant="secondary">Запросить новую ссылку</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-16 sm:py-20">
      <div className="w-full max-w-md px-4 sm:px-6">
        <SectionTitle
          title="Новый пароль"
          subtitle="Придумайте новый пароль для входа"
          className="mb-8"
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="password"
            label="Новый пароль"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error ? <p className="text-xs text-error font-body">{error}</p> : null}

          <Button type="submit" className="mt-2 w-full" loading={resetMutation.isPending}>
            Сохранить пароль
          </Button>
        </form>
      </div>
    </div>
  );
}
