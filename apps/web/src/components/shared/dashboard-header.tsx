'use client';

import { usePathname, useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import {
  useState, useRef, useEffect,
} from 'react';

const breadcrumbMap: Record<string, string> = {
  '': 'Обзор',
  'mobile': 'Мобильный режим',
  'calendar': 'Календарь',
  'appointments': 'Записи',
  'customers': 'Клиенты',
  'services-page': 'Услуги',
  'statistics': 'Статистика',
  'portfolio': 'Портфолио',
  'reviews': 'Отзывы',
  'settings': 'Настройки',
};

function getBreadcrumbs(pathname: string) {
  const segments = pathname.replace(/^\/barber\/?/, '').split('/').filter(Boolean);
  return segments.length > 0 ? segments.map((s) => breadcrumbMap[s] ?? s) : ['Панель управления'];
}

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();
  const logoutMut = trpc.auth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem('bp_access_token');
      localStorage.removeItem('bp_refresh_token');
      utils.invalidate();
      router.push('/auth/login');
    },
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const breadcrumbs = getBreadcrumbs(pathname);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`
    : '??';

  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <div>
        <nav aria-label="Breadcrumb" className="mb-1">
          <ol className="flex items-center gap-1.5 text-xs text-text-tertiary font-body">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb} className="flex items-center gap-1.5">
                {i > 0 && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary/50">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                )}
                <span className={i === breadcrumbs.length - 1 ? 'text-text-secondary' : ''}>{crumb}</span>
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="font-display text-2xl font-bold text-text-primary">{breadcrumbs[breadcrumbs.length - 1] ?? 'Панель управления'}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Уведомления"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-bg-elevated text-text-secondary hover:text-text-primary hover:border-accent/30 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-error text-[8px] font-bold text-white">0</span>
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-bg-elevated text-sm font-semibold text-accent font-body hover:border-accent/30 transition-all"
          >
            {initials}
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 min-w-[200px] rounded-xl border border-border bg-bg-elevated p-2 shadow-xl animate-scale-in">
              <div className="mb-2 border-b border-border px-3 pb-2">
                <p className="text-sm font-medium text-text-primary font-body">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-text-tertiary font-body">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => { router.push('/barber/settings'); setProfileOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors font-body"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                Настройки
              </button>
              <button
                type="button"
                onClick={() => {
                  const rt = localStorage.getItem('bp_refresh_token');
                  if (rt) logoutMut.mutate({ refreshToken: rt });
                  setProfileOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-error hover:bg-error/10 transition-colors font-body"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
