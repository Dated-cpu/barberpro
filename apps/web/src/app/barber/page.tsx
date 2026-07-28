'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает', CONFIRMED: 'Подтверждён', IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершён', CANCELLED: 'Отменён', NO_SHOW: 'Не пришёл',
};

const STATUS_COLORS: Record<string, 'warning' | 'accent' | 'success' | 'error' | 'default'> = {
  PENDING: 'warning', CONFIRMED: 'accent', IN_PROGRESS: 'accent',
  COMPLETED: 'success', CANCELLED: 'error', NO_SHOW: 'error',
};

export default function BarberDashboard() {
  const { addToast } = useToast();
  const utils = trpc.useUtils();
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, string>>({});

  const { data: overview, isFetching, isError, error } = trpc.dashboard.overview.useQuery();

  const updateStatusMut = trpc.appointment.updateStatus.useMutation({
    onMutate: async ({ id, status }) => {
      setOptimisticStatuses((prev) => ({ ...prev, [id]: status }));
    },
    onSuccess: () => { utils.dashboard.overview.invalidate(); addToast('Статус обновлён', 'success'); },
    onError: (e, { id }) => {
      setOptimisticStatuses((prev) => { const next = { ...prev }; delete next[id]; return next; });
      addToast(e.message, 'error');
    },
    onSettled: () => { utils.dashboard.overview.invalidate(); },
  });

  if (isFetching) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-8 text-center border-error/30 bg-error/5">
        <p className="text-lg mb-2">⚠️</p>
        <p className="text-sm text-error font-body">{error?.message ?? 'Ошибка загрузки данных'}</p>
        <Button size="sm" className="mt-4" onClick={() => utils.dashboard.overview.invalidate()}>Повторить</Button>
      </Card>
    );
  }

  const { today } = overview ?? { today: { totalAppointments: 0, totalRevenue: 0, totalDuration: 0, loadPercent: 0, nextAppointment: null, appointments: [] } };
  const nextAppointment = today.nextAppointment;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-text-primary">Панель управления</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="mb-1 text-xs text-text-tertiary font-body">Записей сегодня</p>
          <p className="font-display text-3xl font-bold text-text-primary">{today.totalAppointments}</p>
        </Card>
        <Card className="p-5">
          <p className="mb-1 text-xs text-text-tertiary font-body">Выручка</p>
          <p className="font-display text-3xl font-bold text-accent">{today.totalRevenue.toLocaleString()} ₽</p>
        </Card>
        <Card className="p-5">
          <p className="mb-1 text-xs text-text-tertiary font-body">Загрузка дня</p>
          <div className="flex items-center gap-3">
            <p className="font-display text-3xl font-bold text-text-primary">{Math.round(today.loadPercent)}%</p>
            <div className="h-2 flex-1 rounded-full bg-bg-tertiary">
              <div className="h-2 rounded-full bg-accent transition-all duration-500" style={{ width: `${Math.min(today.loadPercent, 100)}%` }} />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <p className="mb-1 text-xs text-text-tertiary font-body">Активных клиентов</p>
          <p className="font-display text-3xl font-bold text-text-primary">{overview?.totalUniqueClients ?? 0}</p>
        </Card>
      </div>

      {nextAppointment ? (
        <Card className="border-accent/30 bg-accent-muted p-5">
          <p className="mb-1 text-xs text-text-tertiary font-body">Следующий клиент</p>
          <p className="font-display text-lg font-semibold text-text-primary">{nextAppointment.clientName}</p>
          <p className="text-sm text-text-secondary font-body">
            {new Date(nextAppointment.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} — {nextAppointment.serviceName}
          </p>
          <div className="mt-3 flex gap-2">
            {nextAppointment.status === 'PENDING' && (
              <Button size="sm" onClick={() => updateStatusMut.mutate({ id: nextAppointment.id, status: 'CONFIRMED' })}>Подтвердить</Button>
            )}
            {nextAppointment.status === 'CONFIRMED' && (
              <Button size="sm" onClick={() => updateStatusMut.mutate({ id: nextAppointment.id, status: 'IN_PROGRESS' })}>Начать</Button>
            )}
            {nextAppointment.status === 'IN_PROGRESS' && (
              <Button size="sm" variant="primary" onClick={() => updateStatusMut.mutate({ id: nextAppointment.id, status: 'COMPLETED' })}>Завершить</Button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <p className="text-sm text-text-tertiary font-body">Нет записей на сегодня</p>
        </Card>
      )}

      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Записи на сегодня</h2>
        <div className="flex flex-col gap-2">
          {today.appointments.length > 0 ? (
            today.appointments.map((a) => {
              const optStatus = optimisticStatuses[a.id];
              const displayStatus = optStatus ?? a.status;
              return (
                <Card key={a.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <p className="font-body text-sm font-medium text-text-primary">
                      {new Date(a.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div>
                      <p className="text-sm text-text-primary font-body">{a.clientName}</p>
                      <p className="text-xs text-text-tertiary font-body">{a.serviceName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-accent font-body">{a.price.toLocaleString()} ₽</span>
                    <Badge variant={STATUS_COLORS[displayStatus] ?? 'default'}>{STATUS_LABELS[displayStatus] ?? displayStatus}</Badge>
                    <div className="flex gap-1">
                      {displayStatus === 'PENDING' && <Button size="xs" onClick={() => updateStatusMut.mutate({ id: a.id, status: 'CONFIRMED' })}>Ок</Button>}
                      {displayStatus === 'CONFIRMED' && <Button size="xs" onClick={() => updateStatusMut.mutate({ id: a.id, status: 'IN_PROGRESS' })}>Старт</Button>}
                      {displayStatus === 'IN_PROGRESS' && <Button size="xs" variant="primary" onClick={() => updateStatusMut.mutate({ id: a.id, status: 'COMPLETED' })}>Готово</Button>}
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-6 text-center">
              <p className="text-sm text-text-tertiary font-body">Сегодня записей нет. Отличный день, чтобы отдохнуть!</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
