'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждено',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
  NO_SHOW: 'Не явился',
};

const statusColors: Record<string, string> = {
  PENDING: 'text-yellow-400',
  CONFIRMED: 'text-green-400',
  COMPLETED: 'text-text-tertiary',
  CANCELLED: 'text-error',
  NO_SHOW: 'text-error',
};

interface HistoryServiceItem {
  id: string;
  serviceId: string;
  priceAtBooking: string;
  durationAtBooking: number;
  service: { id: string; name: string; duration: number; price: string };
}

interface HistoryItem {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  priceAtBooking: string;
  service: { id: string; name: string; duration: number };
  appointmentServices?: HistoryServiceItem[];
  barber: { id: string; firstName: string; lastName: string };
}

type FilterPeriod = 'all' | 'month' | 'year';

export function AppointmentHistory() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allItems, setAllItems] = useState<HistoryItem[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');

  const { data, isPending } = trpc.appointment.myHistory.useQuery(
    { limit: 10, cursor },
  );

  useEffect(() => {
    if (data) {
      setAllItems((prev) => {
        if (!cursor) return data;
        const existingIds = new Set(prev.map((i) => i.id));
        const newItems = data.filter((i) => !existingIds.has(i.id));
        return [...prev, ...newItems];
      });
    }
  }, [data, cursor]);

  const filteredItems = allItems.filter((a) => {
    if (filterPeriod === 'all') return true;
    const date = new Date(a.startTime);
    const now = new Date();
    if (filterPeriod === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return date >= monthAgo;
    }
    if (filterPeriod === 'year') {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return date >= yearAgo;
    }
    return true;
  });

  if (isPending && allItems.length === 0) {
    return <HistorySkeleton />;
  }

  if (allItems.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-secondary p-4 sm:p-5 text-center">
        <h3 className="mb-1 font-display text-base font-semibold text-text-primary">История записей</h3>
        <p className="text-sm text-text-tertiary font-body mb-3">У вас пока нет записей</p>
        <Link href="/booking">
          <Button size="sm">Записаться впервые</Button>
        </Link>
      </div>
    );
  }

  const hasMore = data && data.length >= 10;

  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-semibold text-text-primary">История записей</h3>
        <div className="flex gap-1 rounded-lg border border-border bg-bg-elevated p-0.5">
          {(['all', 'month', 'year'] as FilterPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPeriod(p)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-body transition-colors',
                filterPeriod === p ? 'bg-accent text-text-inverse' : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {p === 'all' ? 'Все' : p === 'month' ? 'Месяц' : 'Год'}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <p className="text-sm text-text-tertiary font-body text-center py-6">
          Нет записей за выбранный период
        </p>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((a) => {
            const start = new Date(a.startTime);
            const dateStr = start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
            const timeStr = start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-elevated p-3 sm:px-4">
                <div className="min-w-0 flex-1">
                  <div>
                    {(a.appointmentServices?.length ?? 0) > 1
                      ? a.appointmentServices!.map((as) => (
                          <p key={as.id} className="truncate text-sm font-medium text-text-primary font-body">
                            {as.service.name}
                          </p>
                        ))
                      : <p className="truncate text-sm font-medium text-text-primary font-body">{a.service.name}</p>
                    }
                  </div>
                  <p className="truncate text-xs text-text-secondary font-body">
                    {a.barber.firstName} {a.barber.lastName} &middot; {dateStr} в {timeStr}
                  </p>
                  <p className="text-xs text-text-tertiary font-body">
                    {Number(a.priceAtBooking).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className={cn('text-xs font-medium font-body', statusColors[a.status] || 'text-text-tertiary')}>
                    {statusLabels[a.status] || a.status}
                  </span>
                  {a.status === 'COMPLETED' && (
                    <Link
                      href={`/booking?services=${encodeURIComponent(
                        (a.appointmentServices?.length ?? 0) > 0
                          ? a.appointmentServices!.map((as) => as.serviceId).join(',')
                          : a.service.id,
                      )}`}
                      className="text-[10px] text-accent underline-offset-2 hover:underline font-body"
                    >
                      Повторить запись
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasMore ? (
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor(allItems[allItems.length - 1]?.id)}
            loading={isPending}
          >
            Показать ещё
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4 sm:p-5 animate-pulse">
      <div className="mb-4 h-5 w-32 rounded bg-bg-elevated" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-bg-elevated" />
        ))}
      </div>
    </div>
  );
}
