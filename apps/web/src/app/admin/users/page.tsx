'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';

const ROLE_LABELS: Record<string, string> = { CLIENT: 'Клиент', BARBER: 'Барбер', ADMIN: 'Админ', SUPER_ADMIN: 'Гл. админ' };
const ROLE_COLORS: Record<string, 'default' | 'accent' | 'success'> = { CLIENT: 'default', BARBER: 'accent', ADMIN: 'success', SUPER_ADMIN: 'success' };

const ROLE_OPTIONS = ['', 'ADMIN', 'BARBER', 'CLIENT'] as const;

export default function AdminUsers() {
  const { addToast } = useToast();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ firstName: string; lastName: string; email: string; role: string; isActive: boolean }>(
    { firstName: '', lastName: '', email: '', role: 'CLIENT', isActive: true },
  );

  const { data, isFetching } = trpc.admin.listAllUsers.useQuery({ search: search || undefined, role: (roleFilter || undefined) as 'ADMIN' | 'BARBER' | 'CLIENT' | undefined });

  const updateMut = trpc.admin.updateUser.useMutation({
    onSuccess: () => { utils.admin.listAllUsers.invalidate(); setEditingId(null); addToast('Пользователь обновлён', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  const deleteMut = trpc.admin.deleteUser.useMutation({
    onSuccess: () => { utils.admin.listAllUsers.invalidate(); addToast('Пользователь удалён', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  function openEdit(u: { id: string; firstName: string; lastName: string; email: string | null; role: string; isActive: boolean }) {
    setEditingId(u.id);
    setEditForm({ firstName: u.firstName, lastName: u.lastName, email: u.email ?? '', role: u.role, isActive: u.isActive });
  }

  function handleSave() {
    if (!editingId) return;
    const data: Record<string, unknown> = {};
    if (editForm.firstName) data.firstName = editForm.firstName;
    if (editForm.lastName) data.lastName = editForm.lastName;
    if (editForm.email) data.email = editForm.email;
    if (editForm.role) data.role = editForm.role;
    data.isActive = editForm.isActive;
    updateMut.mutate({ id: editingId, ...data } as any);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 flex-wrap justify-end">
        <Input id="users-search" placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
        <div className="flex gap-1 rounded-xl border border-border bg-bg-secondary p-1">
          {ROLE_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-lg px-3 py-1.5 text-xs transition-colors font-body ${
                roleFilter === r ? 'bg-accent text-text-inverse' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {r ? ROLE_LABELS[r] ?? r : 'Все'}
            </button>
          ))}
        </div>
      </div>

      <Modal open={!!editingId} onClose={() => setEditingId(null)} title="Редактировать пользователя">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input id="eu-firstname" label="Имя" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} required />
            <Input id="eu-lastname" label="Фамилия" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} required />
          </div>
          <Input id="eu-email" label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-tertiary font-body">Роль</label>
            <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              className="rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary font-body">
              {Object.entries(ROLE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-text-secondary font-body">
            <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
            Активен
          </label>
          <div className="flex gap-2">
            <Button onClick={handleSave} loading={updateMut.isPending}>Сохранить</Button>
            <Button variant="danger" onClick={() => { if (editingId) deleteMut.mutate({ id: editingId }); }} loading={deleteMut.isPending}>Удалить</Button>
          </div>
        </div>
      </Modal>

      {isFetching ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : data?.items && data.items.length > 0 ? (
        <div className="flex flex-col gap-2">
          {data.items.map((u) => (
            <Card key={u.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent font-body">
                  {u.firstName[0]}{u.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary font-body">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-text-tertiary font-body">{u.email ?? u.phone ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={ROLE_COLORS[u.role] ?? 'default'}>{ROLE_LABELS[u.role] ?? u.role}</Badge>
                <Badge variant={u.isActive ? 'success' : 'error'}>{u.isActive ? 'Активен' : 'Заблокирован'}</Badge>
                {u.lastLogin ? (
                  <span className="text-xs text-text-tertiary font-body">{new Date(u.lastLogin).toLocaleDateString('ru-RU')}</span>
                ) : null}
                <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>Редакт.</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center"><p className="text-sm text-text-tertiary font-body">Пользователи не найдены</p></Card>
      )}

      {data?.nextCursor && (
        <button
          onClick={() => utils.admin.listAllUsers.invalidate()}
          className="self-center text-sm text-accent hover:text-accent/80 transition-colors font-body"
        >
          Загрузить ещё
        </button>
      )}
    </div>
  );
}
