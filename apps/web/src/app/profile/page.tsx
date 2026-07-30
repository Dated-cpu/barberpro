'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionTitle } from '@/components/shared/section-title';
import { MobileBackButton } from '@/components/shared/mobile-back-button';
import { authStorage } from '@/lib/auth-storage';
import { cn } from '@/lib/utils';
import { ProfileHeader } from '@/components/profile/profile-header';
import { UpcomingAppointmentCard, UpcomingAppointmentCardSkeleton, UpcomingAppointmentEmpty, type UpcomingAppointment } from '@/components/profile/upcoming-appointment-card';
import { AppointmentHistory } from '@/components/profile/appointment-history';
import { CustomerStats } from '@/components/profile/customer-stats';
import type { AuthUser } from '@/types/auth';

type Tab = 'profile' | 'security';

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const { data: user, isLoading, error: userError } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && (userError || !user)) {
      router.push('/auth/login');
    }
  }, [user, userError, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-16">
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-text-secondary font-body">Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 sm:py-20">
      <MobileBackButton />
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <SectionTitle
          title="Личный кабинет"
          subtitle="Управление профилем и записями"
          align="left"
          className="mb-6"
        />

        <div className="mb-8 flex gap-2 border-b border-border overflow-x-auto">
          {[['profile', 'Профиль'] as const, ['security', 'Безопасность'] as const].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'min-h-11 shrink-0 px-4 py-3 text-sm font-body transition-colors border-b-2 -mb-px',
                activeTab === key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && <ProfileTab user={user} />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  );
}

function ProfileTab({ user }: { user: AuthUser }) {
  const { data: upcoming, isPending: upcomingLoading } = trpc.appointment.myUpcoming.useQuery();
  const [queryKey, setQueryKey] = useState(0);

  const { data: userFull } = trpc.auth.me.useQuery();
  const createdAt = userFull?.createdAt ? String(userFull.createdAt) : undefined;

  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email ?? '',
    phone: user.phone ?? '',
  });
  const [success, setSuccess] = useState('');

  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      setSuccess('Данные сохранены');
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const handleSave = () => {
    setSuccess('');
    updateMutation.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email || undefined,
      phone: form.phone,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <ProfileHeader user={user} createdAt={createdAt} />

      <CustomerStats />

      {upcomingLoading ? (
        <UpcomingAppointmentCardSkeleton />
      ) : upcoming ? (
        <UpcomingAppointmentCard
          key={queryKey}
          appointment={upcoming as unknown as UpcomingAppointment}
          onCancelled={() => setQueryKey((k) => k + 1)}
        />
      ) : (
        <UpcomingAppointmentEmpty />
      )}

      <AppointmentHistory />

      <div className="border-t border-border pt-6">
        <h3 className="mb-4 font-display text-base font-semibold text-text-primary">Редактировать профиль</h3>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="firstName"
              label="Имя"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <Input
              id="lastName"
              label="Фамилия"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <Input
            id="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            id="phone"
            label="Телефон"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          {success ? <p className="text-xs text-success font-body">{success}</p> : null}
          {updateMutation.isError ? <p className="text-xs text-error font-body">{updateMutation.error.message}</p> : null}

          <div className="flex gap-3">
            <Button onClick={handleSave} loading={updateMutation.isPending} className="w-full sm:w-auto">
              Сохранить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
  const router = useRouter();
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '' });
  const [passError, setPassError] = useState('');

  const changePassMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      setPassForm({ oldPassword: '', newPassword: '' });
      setPassError('');
    },
    onError: (err) => setPassError(err.message),
  });

  const logoutMutation = trpc.auth.logout.useMutation();
  const logoutAllMutation = trpc.auth.logoutAll.useMutation();

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    if (!passForm.oldPassword || !passForm.newPassword) {
      setPassError('Заполните все поля');
      return;
    }
    changePassMutation.mutate(passForm);
  };

  const handleLogout = async () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        authStorage.clearSession();
        router.push('/');
      },
      onError: () => {
        authStorage.clearSession();
        router.push('/');
      },
    });
  };

  const handleLogoutAll = () => {
    logoutAllMutation.mutate(undefined, {
      onSuccess: () => {
        authStorage.clearSession();
        router.push('/');
      },
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 font-display text-base font-semibold text-text-primary">Смена пароля</h3>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4 max-w-sm">
          <Input
            id="oldPassword"
            label="Текущий пароль"
            type="password"
            placeholder="••••••••"
            value={passForm.oldPassword}
            onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })}
          />
          <Input
            id="newPassword"
            label="Новый пароль"
            type="password"
            placeholder="••••••••"
            value={passForm.newPassword}
            onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
          />

          {passError ? <p className="text-xs text-error font-body">{passError}</p> : null}
          {changePassMutation.isSuccess ? (
            <p className="text-xs text-success font-body">Пароль успешно изменён</p>
          ) : null}

          <Button type="submit" variant="secondary" loading={changePassMutation.isPending}>
            Изменить пароль
          </Button>
        </form>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="mb-4 font-display text-base font-semibold text-text-primary">Сессии</h3>
        <div className="flex gap-3 flex-wrap">
          <Button variant="ghost" onClick={handleLogout}>
            Выйти
          </Button>
          <Button variant="danger" onClick={handleLogoutAll} loading={logoutAllMutation.isPending}>
            Выйти из всех устройств
          </Button>
        </div>
      </div>
    </div>
  );
}
