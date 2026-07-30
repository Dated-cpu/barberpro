'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/page-header';

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function thirtyDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

export default function StatisticsPage() {
  const [from, setFrom] = useState(thirtyDaysAgo());
  const [to, setTo] = useState(todayString());

  const { data, isFetching, isError, error, refetch } = trpc.dashboard.analytics.useQuery(
    { from, to },
    { enabled: !!from && !!to },
  );

  const maxDailyRevenue = useMemo(() => {
    if (!data?.dailyStats) return 0;
    return Math.max(...Object.values(data.dailyStats).map((d) => d.revenue), 0);
  }, [data]);

  const sortedDays = useMemo(() => {
    if (!data?.dailyStats) return [];
    return Object.entries(data.dailyStats)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  const categoryEntries = useMemo(() => {
    if (!data?.categoryStats) return [];
    return Object.entries(data.categoryStats)
      .sort(([, a], [, b]) => b.revenue - a.revenue);
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Статистика" />

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Input
            id="stat-from"
            label="От"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-40"
          />
          <Input
            id="stat-to"
            label="До"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-40"
          />
          <Button size="sm" onClick={() => refetch()}>Обновить</Button>
        </div>
      </Card>

      {isFetching ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center border-error/30 bg-error/5">
          <p className="text-sm text-error font-body">{error?.message ?? 'Ошибка загрузки статистики'}</p>
          <Button size="sm" className="mt-4" onClick={() => refetch()}>Повторить</Button>
        </Card>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="mb-1 text-xs text-text-tertiary font-body">Выручка</p>
              <p className="font-display text-3xl font-bold text-accent">{data.totalRevenue.toLocaleString()} ₽</p>
            </Card>
            <Card className="p-5">
              <p className="mb-1 text-xs text-text-tertiary font-body">Записей</p>
              <p className="font-display text-3xl font-bold text-text-primary">{data.totalAppointments}</p>
            </Card>
            <Card className="p-5">
              <p className="mb-1 text-xs text-text-tertiary font-body">Средний чек</p>
              <p className="font-display text-3xl font-bold text-text-primary">{Math.round(data.avgRevenue).toLocaleString()} ₽</p>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Ежедневная выручка</h2>
            {sortedDays.length > 0 ? (
              <div className="flex items-end gap-1.5 overflow-x-auto pb-2" style={{ minHeight: 140 }}>
                {sortedDays.map(([day, stats]) => {
                  const height = maxDailyRevenue > 0 ? (stats.revenue / maxDailyRevenue) * 100 : 0;
                  return (
                    <div key={day} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: 32 }}>
                      <span className="text-[10px] text-text-tertiary font-body">{stats.revenue > 0 ? Math.round(stats.revenue).toLocaleString() : ''}</span>
                      <div className="w-full rounded-t-md bg-accent/70 transition-all duration-300" style={{ height: `${Math.max(height, stats.revenue > 0 ? 4 : 0)}%`, minHeight: stats.revenue > 0 ? 4 : 0 }} />
                      <span className="text-[10px] text-text-tertiary font-body">{day.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-tertiary font-body">Нет данных за выбранный период</p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">По категориям</h2>
            {categoryEntries.length > 0 ? (
              <div className="flex flex-col gap-3">
                {categoryEntries.map(([cat, stats]) => {
                  const maxCatRevenue = Math.max(...categoryEntries.map(([, s]) => s.revenue), 0);
                  const barWidth = maxCatRevenue > 0 ? (stats.revenue / maxCatRevenue) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm text-text-primary font-body capitalize">{cat === 'other' ? 'Прочее' : cat}</span>
                        <span className="text-xs text-text-tertiary font-body">
                          {stats.count} зап. · {stats.revenue.toLocaleString()} ₽
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-bg-tertiary">
                        <div className="h-2 rounded-full bg-accent transition-all duration-500" style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-tertiary font-body">Нет данных за выбранный период</p>
            )}
          </Card>

          <Card className="p-4">
            <p className="text-xs text-text-tertiary font-body">
              Период: {new Date(data.period.from).toLocaleDateString('ru-RU')} — {new Date(data.period.to).toLocaleDateString('ru-RU')}
            </p>
          </Card>
        </>
      ) : null}
    </div>
  );
}
