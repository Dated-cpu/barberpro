'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { trpc } from '@/trpc/client';

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddClientModal({ open, onClose }: AddClientModalProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'invite'>('select');
  const { addToast } = useToast();
  const utils = trpc.useUtils();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+7');
  const [email, setEmail] = useState('');

  const createMut = trpc.admin.addClient.useMutation({
    onSuccess: () => {
      addToast('Клиент добавлен', 'success');
      utils.admin.listAllClients.invalidate();
      utils.customers.list.invalidate();
      handleClose();
    },
    onError: (err) => {
      addToast(err.message, 'error');
    },
  });

  function handleClose() {
    setMode('select');
    setFirstName('');
    setLastName('');
    setPhone('+7');
    setEmail('');
    onClose();
  }

  function handleCreate() {
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      addToast('Заполните имя, фамилию и телефон', 'error');
      return;
    }
    createMut.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
    });
  }

  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/register`
    : '';

  return (
    <Modal open={open} onClose={handleClose} title="Добавить клиента" className="max-w-md">
      {mode === 'select' && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setMode('invite')}
            className="flex items-center gap-4 rounded-xl border border-border bg-bg-secondary p-4 text-left hover:border-accent/30 transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-muted text-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary font-body">Пригласить по ссылке</p>
              <p className="text-xs text-text-tertiary font-body">Клиент сам зарегистрируется</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('create')}
            className="flex items-center gap-4 rounded-xl border border-border bg-bg-secondary p-4 text-left hover:border-accent/30 transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-muted text-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary font-body">Создать вручную</p>
              <p className="text-xs text-text-tertiary font-body">Заполнить данные клиента</p>
            </div>
          </button>
        </div>
      )}

      {mode === 'invite' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary font-body">
            Отправьте клиенту ссылку на регистрацию:
          </p>
          <div className="flex items-center gap-2">
            <Input readOnly value={inviteLink} className="flex-1 text-xs" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                addToast('Ссылка скопирована', 'success');
              }}
            >
              Копировать
            </Button>
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={handleClose}>Закрыть</Button>
          </div>
        </div>
      )}

      {mode === 'create' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="add-first-name"
              label="Имя"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Иван"
            />
            <Input
              id="add-last-name"
              label="Фамилия"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Петров"
            />
          </div>
          <Input
            id="add-phone"
            label="Телефон"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+79991234567"
          />
          <Input
            id="add-email"
            label="Email (необязательно)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ivan@example.com"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setMode('select')}>Назад</Button>
            <Button onClick={handleCreate} loading={createMut.isPending}>
              Создать
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
