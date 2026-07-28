import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4">
      <h1 className="mb-2 font-display text-6xl font-bold text-accent">404</h1>
      <p className="mb-8 text-text-secondary font-body text-center">
        Страница не найдена
      </p>
      <Link href="/">
        <Button>На главную</Button>
      </Link>
    </div>
  );
}
