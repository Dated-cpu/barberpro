'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает подтверждения',
  CONFIRMED: 'Подтверждено',
};

const statusColors: Record<string, string> = {
  PENDING: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  CONFIRMED: 'text-green-400 border-green-400/30 bg-green-400/10',
};

interface UpcomingServiceItem {
  id: string;
  serviceId: string;
  priceAtBooking: string;
  service: { id: string; name: string; duration: number; price: string };
}

interface UpcomingAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  priceAtBooking: string;
  clientNotes: string | null;
  paymentStatus: string;
  service: { id: string; name: string; duration: number; price: string };
  appointmentServices?: UpcomingServiceItem[];
  barber: { id: string; firstName: string; lastName: string };
  branch: { id: string; name: string; address: string | null } | null;
}

export function UpcomingTab() {
  const utils = trpc.useUtils();
  const { addToast } = useToast();
  const { data: appointments, isPending } = trpc.appointment.myUpcomingList.useQuery();

  const cancelMutation = trpc.appointment.cancel.useMutation({
    onSuccess: () => {
      addToast('Запись отменена', 'success');
      utils.appointment.invalidate();
    },
    onError: (err) => {
      addToast(err.message, 'error');
    },
  });

  if (isPending) {
    return <UpcomingListSkeleton />;
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-secondary p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bg-elevated text-text-tertiary">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <h3 className="mb-1 font-display text-base font-semibold text-text-primary">У вас пока нет записей</h3>
        <p className="mb-4 text-sm text-text-tertiary font-body">
          Выберите услугу и удобное время — запись займёт пару минут
        </p>
        <Link href="/booking">
          <Button>Записаться впервые</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => (
        <UpcomingItem
          key={appointment.id}
          appointment={appointment}
          cancelling={cancelMutation.isPending}
          onCancel={() => cancelMutation.mutate({ appointmentId: appointment.id })}
        />
      ))}
    </div>
  );
}

interface UpcomingItemProps {
  appointment: UpcomingAppointment;
  cancelling: boolean;
  onCancel: () => void;
}

function UpcomingItem({ appointment, cancelling, onCancel }: UpcomingItemProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const startDate = new Date(appointment.startTime);
  const dateStr = startDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const endTimeStr = new Date(appointment.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const services = (appointment.appointmentServices?.length ?? 0) > 0
    ? appointment.appointmentServices!
    : [];

  const canCancel = appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';

  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-semibold text-text-primary capitalize">{dateStr}</h3>
            <span className={cn('rounded-md border px-2.5 py-0.5 text-xs font-medium font-body', statusColors[appointment.status] || '')}>
              {statusLabels[appointment.status] || appointment.status}
            </span>
          </div>

          <div className="space-y-1 text-sm font-body">
            {services.length > 0
              ? services.map((as) => (
                  <p key={as.id} className="font-medium text-text-primary">{as.service.name}</p>
                ))
              : <p className="font-medium text-text-primary">{appointment.service.name}</p>
            }
            <p className="text-text-secondary">
              {timeStr} &mdash; {endTimeStr} &middot; {appointment.barber.firstName} {appointment.barber.lastName}
            </p>
            <p className="font-medium text-accent">
              {Number(appointment.priceAtBooking).toLocaleString('ru-RU')} ₽
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canCancel ? (
            showConfirm ? (
              <>
                <Button variant="danger" size="sm" onClick={onCancel} loading={cancelling}>
                  Да, отменить
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>
                  Нет
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setShowConfirm(true)}>
                Отменить
              </Button>
            )
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => setDetailsOpen(!detailsOpen)}>
            {detailsOpen ? 'Скрыть детали' : 'Детали'}
          </Button>
        </div>
      </div>

      {detailsOpen && (
        <div className="mt-4 border-t border-border pt-4 text-sm font-body">
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {appointment.branch ? (
              <div>
                <dt className="text-xs text-text-tertiary">Филиал</dt>
                <dd className="text-text-secondary">
                  {appointment.branch.name}{appointment.branch.address ? `, ${appointment.branch.address}` : ''}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs text-text-tertiary">Барбер</dt>
              <dd className="text-text-secondary">{appointment.barber.firstName} {appointment.barber.lastName}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-tertiary">Номер записи</dt>
              <dd className="text-text-secondary">{appointment.id.slice(0, 8).toUpperCase()}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-tertiary">Оплата</dt>
              <dd className="text-text-secondary">
                {appointment.paymentStatus === 'PAID'
                  ? 'Оплачено'
                  : appointment.paymentStatus === 'REFUNDED' || appointment.paymentStatus === 'PARTIALLY_REFUNDED'
                    ? 'Возврат'
                    : 'Оплата на месте'}
              </dd>
            </div>
            {appointment.clientNotes ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-text-tertiary">Комментарий</dt>
                <dd className="text-text-secondary">{appointment.clientNotes}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      )}
    </div>
  );
}

function UpcomingListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-bg-secondary p-4 sm:p-5">
          <div className="mb-2 h-5 w-48 rounded bg-bg-elevated" />
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-bg-elevated" />
            <div className="h-4 w-56 rounded bg-bg-elevated" />
            <div className="h-4 w-24 rounded bg-bg-elevated" />
          </div>
        </div>
      ))}
    </div>
  );
}
