'use client';

import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/trpc/client';
import { cn } from '@/lib/utils';

const typeLabels: Record<string, string> = {
  APPOINTMENT_CREATED: 'Новая запись',
  APPOINTMENT_CONFIRMED: 'Запись подтверждена',
  APPOINTMENT_REMINDER: 'Напоминание',
  APPOINTMENT_CANCELLED: 'Запись отменена',
  APPOINTMENT_CHANGED: 'Запись изменена',
  REVIEW_REPLY: 'Ответ на отзыв',
  PROMOTION: 'Акция',
  SYSTEM: 'Системное',
  LOYALTY: 'Бонус',
};

function NotificationItem({ n }: { n: { id: string; type: string; title: string; body?: string | null; isRead: boolean; createdAt: string | Date } }) {
  const label = typeLabels[n.type] ?? n.type;
  return (
    <div
      className={cn(
        'flex flex-col gap-0.5 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-bg-tertiary/50',
        !n.isRead && 'bg-accent-muted/10',
      )}
    >
      <div className="flex items-center gap-2">
        {!n.isRead && <span className="h-2 w-2 rounded-full bg-accent shrink-0" />}
        <p className={cn('text-sm font-body', n.isRead ? 'text-text-secondary' : 'text-text-primary font-medium')}>
          {label}
        </p>
      </div>
      <p className="text-xs text-text-tertiary font-body line-clamp-2">{n.title}</p>
      {n.body && <p className="text-xs text-text-tertiary/70 font-body line-clamp-2">{n.body}</p>}
      <p className="text-[10px] text-text-tertiary/50 font-body mt-0.5">
        {new Date(n.createdAt).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </div>
  );
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: notificationsData } = trpc.notifications.list.useQuery(
    { limit: 10 },
    { enabled: open },
  );

  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const markAllMut = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const count = unreadCount ?? 0;

  let body: React.ReactNode;
  if (!notificationsData) {
    body = (
      <div className="flex items-center justify-center py-8">
        <svg className="h-5 w-5 animate-spin text-text-tertiary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  } else if (notificationsData.items.length === 0) {
    body = (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-text-tertiary/50">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        </svg>
        <p className="text-sm text-text-tertiary font-body">Нет уведомлений</p>
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col">
        {notificationsData.items.map((n: any) => (
          <NotificationItem key={n.id} n={n} />
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Уведомления"
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-bg-elevated text-text-secondary hover:text-text-primary hover:border-accent/30 transition-all"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error text-[9px] font-bold text-white px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 min-w-[320px] max-w-sm rounded-xl border border-border bg-bg-elevated shadow-xl animate-scale-in">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-text-primary font-display">Уведомления</h3>
            {count > 0 && (
              <button
                type="button"
                onClick={() => markAllMut.mutate()}
                className="text-xs text-accent hover:text-accent/80 transition-colors font-body"
              >
                Прочитать все
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {body}
          </div>
        </div>
      )}
    </div>
  );
}
