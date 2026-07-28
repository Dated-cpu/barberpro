'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/components/shared/section-title';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => setStatus('success'),
    onError: (err) => { setError(err.message); setStatus('error'); },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    } else {
      setStatus('error');
      setError('Отсутствует токен подтверждения');
    }
  }, [token]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-16 sm:py-20">
      <div className="w-full max-w-md px-4 sm:px-6 text-center">
        {status === 'verifying' && (
          <>
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent-muted">
              <svg className="h-6 w-6 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <SectionTitle title="Подтверждение email" subtitle="Подождите, идёт проверка..." />
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <SectionTitle title="Email подтверждён" subtitle="Ваш email успешно подтверждён" className="mb-6" />
            <Link href="/profile">
              <Button>Перейти в профиль</Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-error-bg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-error">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
            <SectionTitle title="Ошибка" subtitle={error || 'Недействительная или истёкшая ссылка'} className="mb-6" />
            <Link href="/profile">
              <Button variant="secondary">В профиль</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
