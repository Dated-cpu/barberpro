'use client';

import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/page-header';

const STATUS_COLORS: Record<string, 'warning' | 'accent' | 'success' | 'error' | 'default'> = {
  PENDING: 'warning', CONFIRMED: 'accent', IN_PROGRESS: 'accent',
  COMPLETED: 'success', CANCELLED: 'error', NO_SHOW: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает', CONFIRMED: 'Подтверждён', IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершён', CANCELLED: 'Отменён', NO_SHOW: 'Не пришёл',
};

export default function MobileBarberMode() {
  const { addToast } = useToast();
  const utils = trpc.useUtils();

  const { data: overview, isFetching } = trpc.dashboard.overview.useQuery();

  const updateStatusMut = trpc.appointment.updateStatus.useMutation({
    onSuccess: () => { utils.dashboard.overview.invalidate(); utils.dashboard.calendar.invalidate(); addToast('Статус обновлён', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  const today = overview?.today;
  const appointments = today?.appointments ?? [];

  const nextAppointment = today?.nextAppointment;
  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;

  if (isFetching) {
    return (
      <div className="flex flex-col gap-4 p-4 pt-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title="Мой день" />
        <div className="flex items-center gap-2 text-xs text-text-tertiary font-body">
          <span>{appointments.length} записей</span>
          <span className="h-1 w-1 rounded-full bg-text-tertiary" />
          <span className="text-accent">{today?.totalRevenue.toLocaleString()} ₽</span>
        </div>
      </div>

      {/* Next Client Card */}
      {nextAppointment ? (
        <Card className="border-accent/30 bg-accent-muted p-5">
          <p className="mb-1 text-xs text-text-tertiary font-body tracking-wider uppercase">Следующий клиент</p>
          <p className="font-display text-xl font-bold text-text-primary">{nextAppointment.clientName}</p>
          <p className="mb-3 text-sm text-text-secondary font-body">
            {new Date(nextAppointment.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} — {nextAppointment.serviceName}
          </p>
          <div className="flex gap-2">
            {nextAppointment.status === 'PENDING' && (
              <Button size="sm" className="flex-1" onClick={() => updateStatusMut.mutate({ id: nextAppointment.id, status: 'CONFIRMED' })} loading={updateStatusMut.isPending}>
                Подтвердить
              </Button>
            )}
            {nextAppointment.status === 'CONFIRMED' && (
              <Button size="sm" className="flex-1" onClick={() => updateStatusMut.mutate({ id: nextAppointment.id, status: 'IN_PROGRESS' })} loading={updateStatusMut.isPending}>
                Начать
              </Button>
            )}
            {nextAppointment.status === 'IN_PROGRESS' && (
              <Button size="sm" className="flex-1" variant="primary" onClick={() => updateStatusMut.mutate({ id: nextAppointment.id, status: 'COMPLETED' })} loading={updateStatusMut.isPending}>
                Завершить
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-5 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="text-sm text-text-tertiary font-body">Нет записей на сегодня</p>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Сегодня', value: appointments.length, color: 'text-text-primary' },
          { label: 'Подтверждено', value: confirmedCount, color: 'text-accent' },
          { label: 'Ожидают', value: pendingCount, color: 'text-warning' },
        ].map((stat) => (
          <Card key={stat.label} className="p-3 text-center">
            <p className={cn('text-2xl font-bold font-display', stat.color)}>{stat.value}</p>
            <p className="text-xs text-text-tertiary font-body">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Today's Appointments */}
      <div>
        <h2 className="mb-3 font-display text-base font-semibold text-text-primary">Сегодняшние записи</h2>
        <div className="flex flex-col gap-2">
          {appointments.length > 0 ? (
            appointments.map((a) => (
              <Card key={a.id} className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary font-body truncate">{a.clientName}</p>
                    <Badge variant={STATUS_COLORS[a.status] ?? 'default'}>{STATUS_LABELS[a.status] ?? a.status}</Badge>
                  </div>
                  <p className="text-xs text-text-tertiary font-body">
                    {new Date(a.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} — {a.serviceName}
                  </p>
                </div>
                <div className="flex gap-1 ml-3">
                  {a.status === 'PENDING' && (
                    <Button size="xs" variant="primary" onClick={() => updateStatusMut.mutate({ id: a.id, status: 'CONFIRMED' })}>Ок</Button>
                  )}
                  {a.status === 'CONFIRMED' && (
                    <Button size="xs" onClick={() => updateStatusMut.mutate({ id: a.id, status: 'IN_PROGRESS' })}>Старт</Button>
                  )}
                  {a.status === 'IN_PROGRESS' && (
                    <Button size="xs" variant="primary" onClick={() => updateStatusMut.mutate({ id: a.id, status: 'COMPLETED' })}>Готово</Button>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 text-center">
              <p className="text-sm text-text-tertiary font-body">Записей нет</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
