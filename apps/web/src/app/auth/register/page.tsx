'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionTitle } from '@/components/shared/section-title';
import { ConsentCheckbox } from '@/components/ui/consent-checkbox';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      router.push('/profile');
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.firstName || !form.lastName || !form.phone || !form.password) {
      setError('Заполните все обязательные поля');
      return;
    }
    if (!consent) {
      setError('Необходимо принять условия');
      return;
    }
    registerMutation.mutate({ ...form, email: form.email || undefined });
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-16 sm:py-20">
      <div className="w-full max-w-md px-4 sm:px-6">
        <SectionTitle
          title="Регистрация"
          subtitle="Создайте аккаунт для быстрой записи"
          className="mb-8"
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="firstName"
              label="Имя"
              placeholder="Иван"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <Input
              id="lastName"
              label="Фамилия"
              placeholder="Иванов"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <Input
            id="phone"
            label="Телефон"
            type="tel"
            placeholder="+7 (999) 123-45-67"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            id="email"
            label="Email (необязательно)"
            type="email"
            placeholder="ivan@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            id="password"
            label="Пароль"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <ConsentCheckbox
            consentType="terms"
            checked={consent}
            onChange={(v) => { setConsent(v); setError(''); }}
          />

          {error ? (
            <div className="rounded-lg border border-error/30 bg-error-bg px-4 py-2.5">
              <p className="text-xs text-error font-body">{error}</p>
            </div>
          ) : null}

          <Button type="submit" className="mt-2 w-full" loading={registerMutation.isPending}>
            Зарегистрироваться
          </Button>
        </form>

        <p className="mt-6 text-center text-xs sm:text-sm text-text-tertiary font-body">
          Уже есть аккаунт?{' '}
          <Link href="/auth/login" className="text-accent hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
