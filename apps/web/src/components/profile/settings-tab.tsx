'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authStorage } from '@/lib/auth-storage';
import type { AuthUser } from '@/types/auth';

interface SettingsTabProps {
  user: AuthUser;
}

export function SettingsTab({ user }: SettingsTabProps) {
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
    onError: (err) => setProfileError(err.message),
  });
  const [profileError, setProfileError] = useState('');

  const handleSave = () => {
    setProfileError('');
    setSuccess('');
    updateMutation.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email || undefined,
      phone: form.phone,
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="mb-4 font-display text-base font-semibold text-text-primary">Личные данные</h3>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          {profileError ? <p className="text-xs text-error font-body">{profileError}</p> : null}

          <div className="flex gap-3">
            <Button onClick={handleSave} loading={updateMutation.isPending}>
              Сохранить
            </Button>
          </div>
        </div>
      </section>

      <PasswordSection />

      <SessionSection />
    </div>
  );
}

function PasswordSection() {
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '' });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const changePassMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      setPassForm({ oldPassword: '', newPassword: '' });
      setPassError('');
      setPassSuccess('Пароль успешно изменён');
      setTimeout(() => setPassSuccess(''), 3000);
    },
    onError: (err) => {
      setPassError(err.message);
      setPassSuccess('');
    },
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    if (!passForm.oldPassword || !passForm.newPassword) {
      setPassError('Заполните все поля');
      return;
    }
    changePassMutation.mutate(passForm);
  };

  return (
    <section className="border-t border-border pt-6">
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
        {passSuccess ? <p className="text-xs text-success font-body">{passSuccess}</p> : null}

        <Button type="submit" variant="secondary" loading={changePassMutation.isPending}>
          Изменить пароль
        </Button>
      </form>
    </section>
  );
}

function SessionSection() {
  const router = useRouter();
  const logoutMutation = trpc.auth.logout.useMutation();
  const logoutAllMutation = trpc.auth.logoutAll.useMutation();

  const handleLogout = () => {
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
    <section className="border-t border-border pt-6">
      <h3 className="mb-4 font-display text-base font-semibold text-text-primary">Сессии</h3>
      <div className="flex flex-wrap gap-3">
        <Button variant="ghost" onClick={handleLogout}>
          Выйти из аккаунта
        </Button>
        <Button variant="danger" onClick={handleLogoutAll} loading={logoutAllMutation.isPending}>
          Выйти из всех устройств
        </Button>
      </div>
    </section>
  );
}
