'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает подтверждения',
  CONFIRMED: 'Подтверждено',
  IN_PROGRESS: 'Выполняется',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
  NO_SHOW: 'Не явился',
};

const statusColors: Record<string, string> = {
  PENDING: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  CONFIRMED: 'text-green-400 border-green-400/30 bg-green-400/10',
  IN_PROGRESS: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  COMPLETED: 'text-text-tertiary border-border bg-bg-elevated',
  CANCELLED: 'text-error border-error/30 bg-error-bg',
  NO_SHOW: 'text-error border-error/30 bg-error-bg',
};

export interface UpcomingAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  priceAtBooking: string;
  durationAtBooking: number;
  service: { id: string; name: string; duration: number; price: string };
  barber: { id: string; firstName: string; lastName: string };
  branch: { id: string; name: string; address: string | null } | null;
}

interface UpcomingAppointmentCardProps {
  appointment: UpcomingAppointment;
  onCancelled?: () => void;
}

export function UpcomingAppointmentCard({ appointment, onCancelled }: UpcomingAppointmentCardProps) {
  const { addToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);

  const cancelMutation = trpc.appointment.cancel.useMutation({
    onSuccess: () => {
      addToast('Запись отменена', 'success');
      setShowConfirm(false);
      onCancelled?.();
    },
    onError: (err) => {
      addToast(err.message, 'error');
      setShowConfirm(false);
    },
  });

  const startDate = new Date(appointment.startTime);
  const dateStr = startDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const endTime = new Date(appointment.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const handleCancel = () => {
    cancelMutation.mutate({ appointmentId: appointment.id });
  };

  const canCancel = appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';

  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-text-primary">Ближайшая запись</h3>
        <span className={`rounded-md border px-2.5 py-0.5 text-xs font-medium font-body ${statusColors[appointment.status] || ''}`}>
          {statusLabels[appointment.status] || appointment.status}
        </span>
      </div>

      <div className="flex flex-col gap-2 text-sm font-body">
        <p className="font-medium text-text-primary">{appointment.service.name}</p>
        <p className="text-text-secondary">
          {dateStr}, {timeStr} &mdash; {endTime}
        </p>
        <p className="text-text-secondary">
          {appointment.barber.firstName} {appointment.barber.lastName}
        </p>
        {appointment.branch ? (
          <p className="text-xs text-text-tertiary">
            {appointment.branch.name}{appointment.branch.address ? `, ${appointment.branch.address}` : ''}
          </p>
        ) : null}
        <p className="mt-1 font-medium text-accent">
          {Number(appointment.priceAtBooking).toLocaleString('ru-RU')} ₽
        </p>
      </div>

      {canCancel ? (
        <div className="mt-4">
          {showConfirm ? (
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancel}
                loading={cancelMutation.isPending}
              >
                Да, отменить
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>
                Нет
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setShowConfirm(true)}>
              Отменить запись
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function UpcomingAppointmentCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4 sm:p-5 animate-pulse">
      <div className="mb-3 h-5 w-36 rounded bg-bg-elevated" />
      <div className="space-y-2">
        <div className="h-4 w-48 rounded bg-bg-elevated" />
        <div className="h-4 w-56 rounded bg-bg-elevated" />
        <div className="h-4 w-40 rounded bg-bg-elevated" />
        <div className="h-4 w-28 rounded bg-bg-elevated" />
      </div>
    </div>
  );
}

export function UpcomingAppointmentEmpty() {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4 sm:p-5">
      <h3 className="mb-1 font-display text-base font-semibold text-text-primary">Ближайшая запись</h3>
      <p className="text-sm text-text-tertiary font-body">
        У вас нет предстоящих записей
      </p>
    </div>
  );
}
