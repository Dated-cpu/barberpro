'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionTitle } from '@/components/shared/section-title';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => setSent(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    forgotMutation.mutate({ email });
  };

  if (sent) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-16 sm:py-20">
        <div className="w-full max-w-md px-4 sm:px-6 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent-muted">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
              <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </div>
          <SectionTitle
            title="Письмо отправлено"
            subtitle="Если email зарегистрирован, вы получите ссылку для сброса пароля"
            className="mb-6"
          />
          <Link href="/auth/login">
            <Button variant="secondary">Вернуться ко входу</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-16 sm:py-20">
      <div className="w-full max-w-md px-4 sm:px-6">
        <SectionTitle
          title="Восстановление пароля"
          subtitle="Мы отправим ссылку для сброса на ваш email"
          className="mb-8"
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="ivan@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button type="submit" className="mt-2 w-full" loading={forgotMutation.isPending}>
            Отправить
          </Button>
        </form>

        <p className="mt-6 text-center text-xs sm:text-sm text-text-tertiary font-body">
          <Link href="/auth/login" className="text-accent hover:underline">
            Вернуться ко входу
          </Link>
        </p>
      </div>
    </div>
  );
}
