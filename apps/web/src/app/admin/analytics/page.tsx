'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';


export default function AdminAnalytics() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = today.toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(monthEnd);

  const { data, isFetching } = trpc.dashboard.analytics.useQuery({ from, to });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-sm text-text-primary font-body" />
          <span className="text-text-tertiary">—</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-sm text-text-primary font-body" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="mb-1 text-xs text-text-tertiary font-body">Всего записей</p>
          <p className="text-2xl font-bold text-text-primary font-display">
            {isFetching ? '...' : data?.totalAppointments ?? 0}
          </p>
        </Card>
        <Card className="p-5">
          <p className="mb-1 text-xs text-text-tertiary font-body">Выручка</p>
          <p className="text-2xl font-bold text-accent font-display">
            {isFetching ? '...' : `${(data?.totalRevenue ?? 0).toLocaleString()} ₽`}
          </p>
        </Card>
        <Card className="p-5">
          <p className="mb-1 text-xs text-text-tertiary font-body">Средний чек</p>
          <p className="text-2xl font-bold text-text-primary font-display">
            {isFetching ? '...' : `${(data?.avgRevenue ?? 0).toLocaleString()} ₽`}
          </p>
        </Card>
        <Card className="p-5">
          <p className="mb-1 text-xs text-text-tertiary font-body">Категорий</p>
          <p className="text-2xl font-bold text-success font-display">
            {isFetching ? '...' : `${Object.keys(data?.categoryStats ?? {}).length}`}
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <p className="mb-4 text-sm font-medium text-text-primary font-body">По дням</p>
        {isFetching ? (
          <p className="text-sm text-text-tertiary font-body">Загрузка...</p>
        ) : data?.dailyStats && Object.keys(data.dailyStats).length > 0 ? (
          <div className="flex flex-col gap-1">
            {Object.entries(data.dailyStats).map(([date, d]) => (
              <div key={date} className="flex items-center justify-between rounded-lg bg-bg-secondary px-3 py-2 text-sm">
                <span className="text-text-primary font-body">{new Date(date + 'T00:00:00').toLocaleDateString('ru-RU')}</span>
                <div className="flex gap-4">
                  <span className="text-text-secondary font-body">{d.count} зап.</span>
                  <span className="text-accent font-body">{Number(d.revenue).toLocaleString()} ₽</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary font-body">Нет данных за выбранный период</p>
        )}
      </Card>
    </div>
  );
}
