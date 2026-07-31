'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/types/auth';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const CLIENT_ITEMS: MenuItem[] = [
  { href: '/profile', label: 'Профиль', icon: <UserIcon /> },
  { href: '/profile', label: 'История записей', icon: <CalendarIcon /> },
];

const ROLE_ITEMS: Partial<Record<AuthUser['role'], MenuItem[]>> = {
  CLIENT: CLIENT_ITEMS,
  BARBER: [
    { href: '/barber', label: 'Личный кабинет', icon: <UserIcon /> },
    { href: '/barber/settings', label: 'Настройки', icon: <SettingsIcon /> },
  ],
  ADMIN: [
    { href: '/admin', label: 'Личный кабинет', icon: <UserIcon /> },
    { href: '/admin/settings', label: 'Настройки', icon: <SettingsIcon /> },
  ],
  SUPER_ADMIN: [
    { href: '/admin', label: 'Личный кабинет', icon: <UserIcon /> },
    { href: '/admin/settings', label: 'Настройки', icon: <SettingsIcon /> },
  ],
};

interface UserMenuProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export function UserMenu({ mobile = false, onNavigate }: UserMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const logoutMut = trpc.auth.logout.useMutation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleLogout = () => {
    logoutMut.mutate(undefined, {
      onSuccess: () => {
        utils.invalidate();
        setOpen(false);
        onNavigate?.();
        router.push('/');
      },
      onError: () => {
        utils.invalidate();
        setOpen(false);
        onNavigate?.();
        router.push('/');
      },
    });
  };

  if (isLoading) {
    return <Skeleton className="h-11 w-11 sm:w-28" />;
  }

  if (!user) {
    if (mobile) {
      return (
        <>
          <Link href="/profile" onClick={onNavigate} className="flex items-center rounded-lg px-4 min-h-11 text-sm font-body text-text-secondary hover:text-accent transition-colors">
            Профиль
          </Link>
          <Link href="/auth/login" onClick={onNavigate}>
            <Button variant="ghost" className="w-full">Войти</Button>
          </Link>
        </>
      );
    }
    return (
      <>
        <Link href="/profile" className="hidden md:inline rounded-lg px-4 py-2 text-sm font-body text-text-secondary hover:text-accent transition-colors">
          Профиль
        </Link>
        <Link href="/auth/login">
          <Button variant="ghost" size="sm">Войти</Button>
        </Link>
      </>
    );
  }

  const items = ROLE_ITEMS[user.role] ?? CLIENT_ITEMS;
  const name = user.firstName || user.email?.split('@')[0] || 'Клиент';
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.trim();

  const avatar = (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-bg-elevated text-xs font-semibold text-accent font-body">
      {initials || <UserIcon />}
    </span>
  );

  if (mobile) {
    return (
      <>
        <div className="flex items-center gap-2 rounded-lg px-4 min-h-11 text-sm font-semibold text-text-primary font-body">
          {avatar}
          {name}
        </div>
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg px-4 min-h-11 text-sm font-body text-text-secondary hover:text-accent transition-colors"
          >
            <span className="text-text-tertiary">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-4 min-h-11 text-sm font-body text-error hover:bg-error/10 transition-colors"
        >
          <LogoutIcon />
          Выйти
        </button>
      </>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Профиль"
        className={cn(
          'flex h-11 items-center gap-2 rounded-lg px-2 sm:px-3 text-sm font-body transition-colors',
          open ? 'bg-bg-tertiary' : 'hover:bg-bg-tertiary',
        )}
      >
        {avatar}
        <span className="hidden sm:block max-w-32 truncate font-medium text-text-primary">{name}</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={cn('hidden sm:block text-text-tertiary transition-transform duration-200', open && 'rotate-180')}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 z-50 min-w-60 rounded-xl border border-border bg-bg-elevated p-2 shadow-xl animate-scale-in">
          <div className="mb-2 border-b border-border px-3 pb-2">
            <p className="truncate text-sm font-medium text-text-primary font-body">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-text-tertiary font-body">{user.email ?? user.phone}</p>
          </div>
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors font-body"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          <hr className="my-2 border-border" />
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-error hover:bg-error/10 transition-colors font-body"
          >
            <LogoutIcon />
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
