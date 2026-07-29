'use client';

import { useMemo } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminOverview() {
  const { data: overview, isFetching } = trpc.dashboard.adminOverview.useQuery();

  const { data: analytics } = trpc.dashboard.analytics.useQuery(
    (() => {
      const now = new Date();
      const from = new Date(now); from.setDate(from.getDate() - 30);
      return { from: from.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
    })(),
  );

  const topDays = useMemo(() => {
    if (!analytics?.dailyStats) return [];
    return Object.entries(analytics.dailyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14);
  }, [analytics]);

  if (isFetching) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5"><Skeleton className="h-16" /></Card>
          ))}
        </div>
      </div>
    );
  }

  const primaryStats = [
    { label: 'Сегодня записей', value: overview?.today?.totalAppointments ?? 0, sub: '' },
    { label: 'Выручка сегодня', value: `${(overview?.today?.totalRevenue ?? 0).toLocaleString()} ₽`, sub: '' },
    { label: 'Выручка неделя', value: `${(overview?.weeklyRevenue ?? 0).toLocaleString()} ₽`, sub: '' },
    { label: 'Средний чек', value: `${(overview?.avgCheck ?? 0).toLocaleString()} ₽`, sub: '30 дней' },
  ];

  const secondaryStats = [
    { label: 'Загрузка сегодня', value: `${Math.round(overview?.today?.loadPercent ?? 0)}%` },
    { label: 'Выполнено за неделю', value: overview?.weeklyCompleted ?? 0 },
    { label: 'Всего клиентов', value: overview?.totalUniqueClients ?? 0 },
    { label: 'Завтра записей', value: overview?.tomorrowAppointments ?? 0 },
    { label: 'Новых отзывов (нед)', value: overview?.newReviews ?? 0 },
  ];

  const maxRevenue = Math.max(...topDays.map(([, d]) => Number(d.revenue)), 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {primaryStats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="mb-1 text-xs text-text-tertiary font-body">{s.label}</p>
            <p className="text-xl font-bold text-text-primary font-display">{s.value}</p>
            {s.sub ? <p className="text-xs text-text-tertiary font-body">{s.sub}</p> : null}
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {secondaryStats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="mb-1 text-xs text-text-tertiary font-body">{s.label}</p>
            <p className="text-lg font-bold text-accent font-display">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <p className="mb-4 text-sm font-medium text-text-primary font-body">Доход по дням (14 дней)</p>
        {topDays.length > 0 ? (
          <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ minHeight: '160px' }}>
            {topDays.map(([date, d]) => (
              <div key={date} className="flex flex-1 flex-col items-center gap-1 min-w-[48px]">
                <span className="text-[10px] text-text-tertiary font-body">{Number(d.revenue).toLocaleString()}₽</span>
                <div
                  className="w-full rounded-t-md bg-accent/70 hover:bg-accent transition-all"
                  style={{ height: `${Math.max((Number(d.revenue) / maxRevenue) * 120, 4)}px` }}
                />
                <span className="text-[10px] text-text-tertiary font-body whitespace-nowrap">
                  {new Date(date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary font-body">Нет данных за период</p>
        )}
      </Card>
    </div>
  );
}
