'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import {
  useState, useRef, useEffect,
} from 'react';

export function DashboardHeader() {
  const router = useRouter();
  const { data: user } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();
  const logoutMut = trpc.auth.logout.useMutation();
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.trim() || '?'
    : '';

  return (
    <header className="mb-6 flex items-center justify-end gap-3">
      <NotificationDropdown />

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-bg-elevated text-sm font-semibold text-accent font-body hover:border-accent/30 transition-all"
          aria-label="Профиль"
        >
          {initials ? (
            <span>{initials}</span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
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
                localStorage.removeItem('bp_access_token');
                localStorage.removeItem('bp_refresh_token');
                sessionStorage.clear();
                document.cookie = 'bp_role=; path=/; max-age=0';
                utils.invalidate();
                setProfileOpen(false);
                router.push('/');
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
    </header>
  );
}
