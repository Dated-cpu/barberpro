'use client';

import { useEffect, useState } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';

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

interface AppointmentHistoryProps {
  onRebook?: (serviceId: string) => void;
}

export function AppointmentHistory({ onRebook: _onRebook }: AppointmentHistoryProps) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allItems, setAllItems] = useState<HistoryItem[]>([]);

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

  if (isPending && allItems.length === 0) {
    return <HistorySkeleton />;
  }

  if (allItems.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-secondary p-4 sm:p-5">
        <h3 className="mb-1 font-display text-base font-semibold text-text-primary">История записей</h3>
        <p className="text-sm text-text-tertiary font-body">У вас пока нет записей</p>
      </div>
    );
  }

  const hasMore = data && data.length >= 10;

  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4 sm:p-5">
      <h3 className="mb-4 font-display text-base font-semibold text-text-primary">История записей</h3>

      <div className="space-y-3">
        {allItems.map((a) => {
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
                <span className={`text-xs font-medium font-body ${statusColors[a.status] || 'text-text-tertiary'}`}>
                  {statusLabels[a.status] || a.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

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
