'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { SectionTitle } from '@/components/shared/section-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConsentCheckbox } from '@/components/ui/consent-checkbox';
import { SlotSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ConsentType } from '@/lib/legal';

type Step = 'service' | 'barber' | 'date' | 'info' | 'confirm';

interface AppointmentResult {
  id: string;
  startTime: string;
  serviceName: string;
  barberName: string;
}

export default function BookingPage() {
  const [step, setStep] = useState<Step>('service');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
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

  const selectedService = services?.find((s) => s.id === selectedServiceId);
  const selectedBarber = barbers?.find((b) => b.id === selectedBarberId);

  const { data: availableSlots, isFetching: slotsLoading } = trpc.availability.getAvailableSlots.useQuery(
    { barberId: selectedBarberId || '', date: selectedDate || '', serviceId: selectedServiceId || '' },
    { enabled: !!selectedDate && !!selectedBarberId && !!selectedServiceId },
  );

  const today = new Date();
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  const handleConfirm = async () => {
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
        barberId: selectedBarberId!,
        serviceId: selectedServiceId!,
        startTime,
        clientName: form.name,
        clientPhone: form.phone,
        clientEmail: form.email || undefined,
      });

      setAppointmentResult({
        id: result.id,
        startTime: startTime,
        serviceName: selectedService?.name || '',
        barberName: selectedBarber ? `${selectedBarber.firstName} ${selectedBarber.lastName}` : '',
      });
      setStep('confirm');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка при создании записи. Попробуйте снова.';
      setConsentError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep('service');
    setSelectedServiceId(null);
    setSelectedBarberId(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setAppointmentResult(null);
    setForm({ name: '', phone: '', email: '' });
    setConsents({ privacy: false, terms: false, personalData: false, bookingRules: false });
  };

  const stepOrder: Step[] = ['service', 'barber', 'date', 'info'];
  const currentStepIndex = stepOrder.indexOf(step);
  const isStepComplete = (s: Step) => stepOrder.indexOf(s) < currentStepIndex || step === 'confirm';

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <SectionTitle
          title="Онлайн-запись"
          subtitle="Выберите услугу, дату и время"
        />

        <div className="mb-6 sm:mb-8 flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto pb-1">
          {(['service', 'barber', 'date', 'info'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div className={cn(
                'flex h-9 sm:h-8 w-9 sm:w-8 items-center justify-center rounded-full text-xs sm:text-xs font-semibold transition-colors font-body',
                step === s
                  ? 'bg-accent text-text-inverse'
                  : isStepComplete(s)
                    ? 'bg-accent-muted text-accent'
                    : 'bg-bg-tertiary text-text-tertiary',
              )}>
                {isStepComplete(s) ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div className={cn(
                  'h-px w-6 sm:w-12',
                  isStepComplete(s) || step === s ? 'bg-accent' : 'bg-border',
                )} />
              )}
            </div>
          ))}
        </div>

        {step === 'service' && (
          <div className="flex flex-col gap-3">
            {servicesLoading ? (
              <div className="flex flex-col gap-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[60px] rounded-xl bg-bg-elevated" />
                ))}
              </div>
            ) : services && services.length > 0 ? (
              services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedServiceId(s.id); setStep('barber'); }}
                  className={cn(
                    'flex items-center justify-between rounded-xl border p-4 text-left transition-all duration-200 min-h-[60px]',
                    selectedServiceId === s.id ? 'border-accent bg-accent-muted' : 'border-border bg-bg-elevated hover:border-accent/50',
                  )}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <h3 className="font-display text-base font-semibold text-text-primary truncate">{s.name}</h3>
                    <p className="text-sm text-text-tertiary font-body">{s.duration} мин</p>
                  </div>
                  <span className="text-base sm:text-lg font-semibold text-accent shrink-0">{Number(s.price).toLocaleString('ru-RU')} ₽</span>
                </button>
              ))
            ) : (
              <p className="text-sm text-text-tertiary font-body text-center py-8">Услуги временно недоступны</p>
            )}
          </div>
        )}

        {step === 'barber' && (
          <div className="flex flex-col gap-3">
            <h3 className="mb-1 text-sm font-semibold text-text-primary font-body">Выберите барбера</h3>
            {barbersLoading ? (
              <div className="flex flex-col gap-3 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-[52px] rounded-xl bg-bg-elevated" />
                ))}
              </div>
            ) : barbers && barbers.length > 0 ? (
              barbers.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { setSelectedBarberId(b.id); setStep('date'); }}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-all duration-200',
                    selectedBarberId === b.id ? 'border-accent bg-accent-muted' : 'border-border bg-bg-elevated hover:border-accent/50',
                  )}
                >
                  <span className="font-display font-semibold text-text-primary">{b.firstName} {b.lastName}</span>
                </button>
              ))
            ) : (
              <p className="text-sm text-text-tertiary font-body text-center py-8">Барберы временно недоступны</p>
            )}
          </div>
        )}

        {step === 'date' && (
          <div>
            <div className="mb-6">
              <h3 className="mb-3 sm:mb-4 text-sm font-semibold text-text-primary font-body">Выберите дату</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 sm:-mx-0 px-4 sm:px-0 snap-x snap-mandatory scrollbar-none">
                {dates.map((d) => {
                  const dateStr = d.toISOString().slice(0, 10);
                  const isSelected = selectedDate === dateStr;
                  const dayName = d.toLocaleDateString('ru-RU', { weekday: 'short' });
                  const dayNum = d.getDate();
                  const monthName = d.toLocaleDateString('ru-RU', { month: 'short' });
                  return (
                    <button
                      key={dateStr}
                      onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null); }}
                      className={cn(
                        'flex min-w-[72px] snap-start flex-col items-center gap-1 rounded-xl border p-3 transition-all duration-200 touch-action-manipulation',
                        isSelected ? 'border-accent bg-accent-muted' : 'border-border bg-bg-elevated hover:border-accent/50',
                      )}
                    >
                      <span className="text-[10px] sm:text-xs text-text-tertiary font-body uppercase">{dayName}</span>
                      <span className={cn('text-base sm:text-lg font-semibold font-display', isSelected ? 'text-accent' : 'text-text-primary')}>{dayNum}</span>
                      <span className="text-[10px] sm:text-xs text-text-tertiary font-body">{monthName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div>
                <h3 className="mb-3 sm:mb-4 text-sm font-semibold text-text-primary font-body">Выберите время</h3>
                {slotsLoading ? (
                  <SlotSkeleton />
                ) : availableSlots && availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 sm:flex sm:flex-wrap gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.startTime}
                        onClick={() => { setSelectedSlot(slot.startTime); setStep('info'); }}
                        className={cn(
                          'rounded-lg border px-3 sm:px-4 py-3 sm:py-2 text-sm transition-all duration-200 font-body text-center',
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
              <Button variant="ghost" size="sm" onClick={() => setStep('barber')}>
                Назад
              </Button>
            </div>
          </div>
        )}

        {step === 'info' && (
          <div className="flex flex-col gap-4">
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
              <p className="mb-3 text-xs sm:text-sm text-text-secondary font-body">Перед записью примите условия:</p>
              <div className="flex flex-col gap-2">
                <ConsentCheckbox
                  consentType="privacy"
                  checked={!!consents.privacy}
                  onChange={(v) => { setConsents((c) => ({ ...c, privacy: v })); setConsentError(''); }}
                />
                <ConsentCheckbox
                  consentType="terms"
                  checked={!!consents.terms}
                  onChange={(v) => { setConsents((c) => ({ ...c, terms: v })); setConsentError(''); }}
                />
                <ConsentCheckbox
                  consentType="personalData"
                  checked={!!consents.personalData}
                  onChange={(v) => { setConsents((c) => ({ ...c, personalData: v })); setConsentError(''); }}
                />
                <ConsentCheckbox
                  consentType="bookingRules"
                  checked={!!consents.bookingRules}
                  onChange={(v) => { setConsents((c) => ({ ...c, bookingRules: v })); setConsentError(''); }}
                />
              </div>
              {consentError ? (
                <p role="alert" className="mt-2 text-xs text-error">{consentError}</p>
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep('date')}>
                Назад
              </Button>
              <Button onClick={handleConfirm} className="flex-1 sm:flex-none" disabled={!form.name || !form.phone || submitting} loading={submitting}>
                Подтвердить запись
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && appointmentResult && (
          <div className="rounded-xl border border-accent/50 bg-accent-muted p-6 sm:p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-success-bg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h3 className="mb-2 font-display text-xl sm:text-2xl font-bold text-text-primary">Запись подтверждена!</h3>
            <p className="mb-6 text-sm sm:text-base text-text-secondary font-body">Мы отправили подтверждение на ваш телефон</p>

            <div className="mx-auto max-w-sm space-y-2 text-left text-sm text-text-secondary font-body">
              <p><span className="text-text-primary">Услуга:</span> {appointmentResult.serviceName}</p>
              <p><span className="text-text-primary">Барбер:</span> {appointmentResult.barberName}</p>
              <p><span className="text-text-primary">Дата:</span> {new Date(appointmentResult.startTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p><span className="text-text-primary">Время:</span> {new Date(appointmentResult.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
              <p><span className="text-text-primary">Имя:</span> {form.name}</p>
            </div>

            <Button onClick={reset} className="mt-8" variant="secondary">
              Записаться ещё
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
