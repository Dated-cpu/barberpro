'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/', label: 'Главная' },
  { href: '/services', label: 'Услуги' },
  { href: '/gallery', label: 'Портфолио' },
  { href: '/reviews', label: 'Отзывы' },
  { href: '/contacts', label: 'Контакты' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      <div className="bg-gradient-to-b from-bg-primary/95 to-bg-primary/60 backdrop-blur-md">
        <nav className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6" aria-label="Главная навигация">
          <Link href="/" className="flex items-center gap-2 font-display text-lg sm:text-xl font-bold tracking-wider text-accent shrink-0">
            BARBER<span className="text-text-primary">PRO</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className={cn(
                  'nav-link-glass rounded-lg px-4 py-2 text-sm font-body',
                  pathname === link.href ? 'text-accent' : 'text-text-secondary hover:text-accent',
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/profile" className="rounded-lg px-4 py-2 text-sm font-body text-text-secondary hover:text-accent transition-colors">
              Профиль
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Войти</Button>
            </Link>
            <Link href="/booking">
              <Button size="sm">Записаться</Button>
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={mobileOpen}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-text-primary md:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              {mobileOpen ? (
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M4 6h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </nav>

        <div
          className={cn(
            'overflow-hidden transition-all duration-300 md:hidden',
            mobileOpen ? 'max-h-96' : 'max-h-0',
          )}
        >
          <div className="flex flex-col gap-1 px-4 sm:px-6 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className={cn(
                  'nav-link-glass rounded-lg px-4 min-h-11 flex items-center text-sm font-body',
                  pathname === link.href ? 'text-accent' : 'text-text-secondary hover:text-accent',
                )}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-border" />
            <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center rounded-lg px-4 min-h-11 text-sm font-body text-text-secondary hover:text-accent transition-colors">
              Профиль
            </Link>
            <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full">Войти</Button>
            </Link>
            <Link href="/booking" onClick={() => setMobileOpen(false)}>
              <Button className="w-full">Записаться</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
