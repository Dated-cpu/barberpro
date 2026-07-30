'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4">
      <h1 className="mb-2 font-display text-6xl font-bold text-accent">500</h1>
      <p className="mb-8 text-text-secondary font-body text-center">
        Что-то пошло не так
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()}>Попробовать снова</Button>
        <Link href="/">
          <Button variant="secondary">На главную</Button>
        </Link>
      </div>
    </div>
  );
}
