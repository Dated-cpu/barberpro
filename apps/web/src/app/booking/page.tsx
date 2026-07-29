'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { trpc } from '@/trpc/client';
import { SectionTitle } from '@/components/shared/section-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConsentCheckbox } from '@/components/ui/consent-checkbox';
import { MobileBackButton } from '@/components/shared/mobile-back-button';
import { SlotSkeleton, ServiceSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ConsentType } from '@/lib/legal';

type Step = 'service' | 'date' | 'info' | 'confirm';

interface AppointmentResult {
  id: string;
  startTime: string;
  serviceName: string;
  duration: number;
  price: number;
  barberName: string;
}

const BARBERSHOP_ADDRESS = 'ул. Тверская, 15, Москва';

function formatDateFull(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTimeShort(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function generateIcsUrl(appointment: AppointmentResult): string {
  const start = new Date(appointment.startTime);
  const end = new Date(start.getTime() + appointment.duration * 60 * 1000);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BarberPro//Booking//RU',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${appointment.serviceName} в BarberPro`,
    `DESCRIPTION:${appointment.serviceName}\\nМастер: ${appointment.barberName}`,
    `LOCATION:${BARBERSHOP_ADDRESS}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

function StepCircle({
  step,
  current,
  index,
  isComplete,
}: {
  step: Step;
  current: Step;
  index: number;
  isComplete: boolean;
}) {
  return (
    <div
      className={cn(
        'flex h-8 w-8 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 font-body',
        current === step
          ? 'bg-accent text-text-inverse scale-110'
          : isComplete
            ? 'bg-accent-muted text-accent'
            : 'bg-bg-tertiary text-text-tertiary',
      )}
    >
      {isComplete ? (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
        </svg>
      ) : (
        index + 1
      )}
    </div>
  );
}

function StepConnector({ active }: { active: boolean }) {
  return (
    <div className={cn('h-px w-5 sm:w-10 transition-colors duration-300', active ? 'bg-accent' : 'bg-border')} />
  );
}

function AnimatedCheckmark() {
  return (
    <div className="mx-auto mb-5 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-success/30 to-success-bg animate-[scale-in_0.4s_ease-out]">
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-success"
      >
        <path
          d="M5 13l4 4L19 7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-[checkmark_0.4s_ease-out_0.2s_forwards]"
          strokeDasharray="30"
          strokeDashoffset="30"
        />
      </svg>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-elevated p-4 transition-colors hover:border-accent/30">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text-tertiary font-body uppercase tracking-wider">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-text-primary font-body break-words">{value}</p>
      </div>
    </div>
  );
}

export default function BookingPage() {
  const [step, setStep] = useState<Step>('service');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [appointmentResult, setAppointmentResult] = useState<AppointmentResult | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [consents, setConsents] = useState<Record<string, boolean>>({
    privacy: false,
    terms: false,
    personalData: false,
    bookingRules: false,
  });
  const [consentError, setConsentError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: services, isPending: servicesLoading } = trpc.services.listActive.useQuery();
  const { data: barbers, isPending: barbersLoading } = trpc.barbers.listActive.useQuery();
  const recordConsent = trpc.consent.record.useMutation();
  const createAppointment = trpc.appointment.create.useMutation();

  const barber = useMemo(() => barbers?.[0] ?? null, [barbers]);
  const selectedService = useMemo(
    () => services?.find((s) => s.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );

  const { data: availableSlots, isFetching: slotsLoading } = trpc.availability.getAvailableSlots.useQuery(
    { barberId: barber?.id ?? '', date: selectedDate || '', serviceId: selectedServiceId || '' },
    { enabled: !!barber && !!selectedDate && !!selectedServiceId },
  );

  const today = useMemo(() => new Date(), []);
  const dates = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [today],
  );

  const handleConfirm = useCallback(async () => {
    const allAccepted = Object.values(consents).every(Boolean);
    if (!allAccepted) {
      setConsentError('Необходимо принять все условия');
      return;
    }
    setConsentError('');
    setSubmitting(true);

    try {
      const startTime = `${selectedDate}T${selectedSlot}:00+03:00`;

      await Promise.all(
        Object.entries(consents)
          .filter(([, v]) => v)
          .map(([type]) => recordConsent.mutateAsync({ consentType: type as ConsentType })),
      );

      const result = await createAppointment.mutateAsync({
        barberId: barber!.id,
        serviceId: selectedServiceId!,
        startTime,
        clientName: form.name,
        clientPhone: form.phone,
        clientEmail: form.email || undefined,
      });

      setAppointmentResult({
        id: result.id,
        startTime,
        serviceName: selectedService?.name || '',
        duration: selectedService?.duration ?? 0,
        price: selectedService ? Number(selectedService.price) : 0,
        barberName: barber ? `${barber.firstName} ${barber.lastName}` : '',
      });
      setStep('confirm');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка при создании записи. Попробуйте снова.';
      setConsentError(message);
    } finally {
      setSubmitting(false);
    }
  }, [consents, selectedDate, selectedSlot, recordConsent, createAppointment, barber, selectedServiceId, selectedService, form]);

  const reset = useCallback(() => {
    setStep('service');
    setSelectedServiceId(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setAppointmentResult(null);
    setForm({ name: '', phone: '', email: '' });
    setConsents({ privacy: false, terms: false, personalData: false, bookingRules: false });
  }, []);

  const stepOrder: Step[] = ['service', 'date', 'info'];
  const currentStepIndex = stepOrder.indexOf(step);
  const isStepComplete = (s: Step) => stepOrder.indexOf(s) < currentStepIndex || step === 'confirm';

  if (barbers && !barbersLoading && barbers.length === 0) {
    return (
      <div className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl px-4 px:px-6 text-center">
          <p className="text-text-tertiary font-body">Запись временно недоступна</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16">
      <MobileBackButton />
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <SectionTitle title="Онлайн-запись" subtitle="Выберите услугу, дату и время" />

        {step !== 'confirm' && (
          <div className="mb-6 sm:mb-8 flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto pb-1">
            {(['service', 'date', 'info'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1 sm:gap-2 shrink-0">
                <StepCircle step={s} current={step} index={i} isComplete={isStepComplete(s)} />
                {i < 2 && <StepConnector active={isStepComplete(s) || step === s} />}
              </div>
            ))}
          </div>
        )}

        {step === 'service' && (
          <div key="service" className="animate-[fade-in_0.25s_ease-out]">
            {servicesLoading || barbersLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <ServiceSkeleton key={i} />
                ))}
              </div>
            ) : services && services.length > 0 ? (
              <div className="flex flex-col gap-3">
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedServiceId(s.id);
                      setStep('date');
                    }}
                    className={cn(
                      'flex items-center justify-between rounded-xl border p-4 text-left transition-all duration-200 min-h-[64px] active:scale-[0.98]',
                      selectedServiceId === s.id
                        ? 'border-accent bg-accent-muted'
                        : 'border-border bg-bg-elevated hover:border-accent/50',
                    )}
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <h3 className="font-display text-base font-semibold text-text-primary truncate">
                        {s.name}
                      </h3>
                      <p className="text-sm text-text-tertiary font-body">{s.duration} мин</p>
                    </div>
                    <span className="text-base sm:text-lg font-semibold text-accent shrink-0">
                      {Number(s.price).toLocaleString('ru-RU')} ₽
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-tertiary font-body text-center py-12">
                Услуги временно недоступны
              </p>
            )}
          </div>
        )}

        {step === 'date' && (
          <div key="date" className="animate-[fade-in_0.25s_ease-out]">
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-text-primary font-body">Выберите дату</h3>
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-4 sm:-mx-0 px-4 sm:px-0 snap-x snap-mandatory scrollbar-none">
                {dates.map((d) => {
                  const dateStr = d.toISOString().slice(0, 10);
                  const isSelected = selectedDate === dateStr;
                  const dayName = d.toLocaleDateString('ru-RU', { weekday: 'short' });
                  const dayNum = d.getDate();
                  const monthName = d.toLocaleDateString('ru-RU', { month: 'short' });
                  return (
                    <button
                      key={dateStr}
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setSelectedSlot(null);
                      }}
                      className={cn(
                        'flex min-w-[68px] sm:min-w-[72px] snap-start flex-col items-center gap-1 rounded-xl border p-2.5 sm:p-3 transition-all duration-200 touch-action-manipulation active:scale-[0.96]',
                        isSelected
                          ? 'border-accent bg-accent-muted'
                          : 'border-border bg-bg-elevated hover:border-accent/50',
                      )}
                    >
                      <span className="text-[10px] text-text-tertiary font-body uppercase">{dayName}</span>
                      <span
                        className={cn(
                          'text-base font-semibold font-display',
                          isSelected ? 'text-accent' : 'text-text-primary',
                        )}
                      >
                        {dayNum}
                      </span>
                      <span className="text-[10px] text-text-tertiary font-body">{monthName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-text-primary font-body">Выберите время</h3>
                {slotsLoading ? (
                  <SlotSkeleton />
                ) : availableSlots && availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 sm:flex sm:flex-wrap gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.startTime}
                        onClick={() => {
                          setSelectedSlot(slot.startTime);
                          setStep('info');
                        }}
                        className={cn(
                          'rounded-lg border px-3 py-3 sm:py-2.5 text-sm transition-all duration-200 font-body text-center active:scale-[0.96]',
                          selectedSlot === slot.startTime
                            ? 'border-accent bg-accent text-text-inverse'
                            : 'border-border bg-bg-elevated text-text-primary hover:border-accent/50',
                        )}
                      >
                        {slot.startTime.slice(0, 5)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-tertiary font-body">Нет доступных слотов на выбранную дату</p>
                )}
              </div>
            )}

            <div className="mt-6 flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep('service')}>
                Назад
              </Button>
            </div>
          </div>
        )}

        {step === 'info' && (
          <div key="info" className="flex flex-col gap-4 animate-[fade-in_0.25s_ease-out]">
            {selectedService && (
              <div className="rounded-xl border border-accent/30 bg-accent-muted p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-tertiary font-body uppercase tracking-wider">Выбранная услуга</p>
                    <p className="mt-0.5 font-display font-semibold text-text-primary">{selectedService.name}</p>
                  </div>
                  <span className="text-base font-semibold text-accent shrink-0 ml-3">
                    {Number(selectedService.price).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                {selectedDate && selectedSlot && (
                  <p className="mt-2 text-xs text-text-tertiary font-body">
                    {formatDateFull(`${selectedDate}T${selectedSlot}:00+03:00`)} в {selectedSlot.slice(0, 5)}
                  </p>
                )}
              </div>
            )}

            <Input
              id="name"
              label="Ваше имя"
              placeholder="Иван"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              id="phone"
              label="Телефон"
              type="tel"
              placeholder="+7 (999) 123-45-67"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              id="email"
              label="Email (необязательно)"
              type="email"
              placeholder="ivan@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <div className="mt-2 border-t border-border pt-4">
              <p className="mb-3 text-xs text-text-secondary font-body">
                Перед записью примите условия:
              </p>
              <div className="flex flex-col gap-2">
                <ConsentCheckbox
                  consentType="privacy"
                  checked={!!consents.privacy}
                  onChange={(v) => {
                    setConsents((c) => ({ ...c, privacy: v }));
                    setConsentError('');
                  }}
                />
                <ConsentCheckbox
                  consentType="terms"
                  checked={!!consents.terms}
                  onChange={(v) => {
                    setConsents((c) => ({ ...c, terms: v }));
                    setConsentError('');
                  }}
                />
                <ConsentCheckbox
                  consentType="personalData"
                  checked={!!consents.personalData}
                  onChange={(v) => {
                    setConsents((c) => ({ ...c, personalData: v }));
                    setConsentError('');
                  }}
                />
                <ConsentCheckbox
                  consentType="bookingRules"
                  checked={!!consents.bookingRules}
                  onChange={(v) => {
                    setConsents((c) => ({ ...c, bookingRules: v }));
                    setConsentError('');
                  }}
                />
              </div>
              {consentError ? (
                <p role="alert" className="mt-2 text-xs text-error">
                  {consentError}
                </p>
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep('date')}>
                Назад
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1"
                disabled={!form.name || !form.phone || submitting || !barber}
                loading={submitting}
              >
                Подтвердить запись
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && appointmentResult && (
          <div key="confirm" className="animate-[fade-in_0.35s_ease-out]">
            <div className="rounded-2xl border border-accent/30 bg-gradient-to-b from-accent-muted/80 to-accent-muted/30 p-5 sm:p-8 text-center">
              <AnimatedCheckmark />
              <h3 className="mb-1 font-display text-xl sm:text-2xl font-bold text-text-primary">
                Запись подтверждена!
              </h3>
              <p className="mb-6 text-sm text-text-secondary font-body">
                Мы отправили подтверждение на ваш телефон
              </p>

              <div className="mx-auto max-w-sm space-y-3 text-left">
                <InfoRow
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 7l-8 4-8-4M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7M12 12l8-4" />
                    </svg>
                  }
                  label="Услуга"
                  value={`${appointmentResult.serviceName} · ${appointmentResult.duration} мин`}
                />
                <InfoRow
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                  }
                  label="Дата и время"
                  value={`${formatDateFull(appointmentResult.startTime)} в ${formatTimeShort(appointmentResult.startTime)}`}
                />
                <InfoRow
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                  }
                  label="Адрес"
                  value={BARBERSHOP_ADDRESS}
                />
                {appointmentResult.price > 0 && (
                  <InfoRow
                    icon={
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                      </svg>
                    }
                    label="Цена"
                    value={`${appointmentResult.price.toLocaleString('ru-RU')} ₽`}
                  />
                )}
              </div>

              <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <a
                  href={generateIcsUrl(appointmentResult)}
                  download="barberpro-record.ics"
                  className="inline-flex items-center justify-center gap-2 min-h-11 rounded-xl border border-gold px-6 text-sm font-medium text-gold transition-all duration-200 hover:bg-gold-muted active:scale-[0.97] font-body"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  Добавить в календарь
                </a>
                <Link
                  href="/profile"
                  className="inline-flex items-center justify-center gap-2 min-h-11 rounded-xl border border-border px-6 text-sm font-medium text-text-secondary transition-all duration-200 hover:border-accent hover:text-accent active:scale-[0.97] font-body"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  Перейти в профиль
                </Link>
              </div>

              <div className="mt-4">
                <Button
                  onClick={reset}
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Записаться ещё
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
