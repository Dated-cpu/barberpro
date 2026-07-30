'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AddClientModal } from '@/components/clients/add-client-modal';

export default function AdminClients() {
  const [search, setSearch] = useState('');
  const [addClientOpen, setAddClientOpen] = useState(false);

  const { data, isFetching } = trpc.admin.listAllClients.useQuery({ search: search || undefined });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Button onClick={() => setAddClientOpen(true)} size="sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Добавить клиента
        </Button>
        <Input id="client-search" placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
      </div>

      <AddClientModal open={addClientOpen} onClose={() => setAddClientOpen(false)} />

      {isFetching ? (
        <Card className="p-6 text-center"><p className="text-sm text-text-tertiary font-body">Загрузка...</p></Card>
      ) : data?.items && data.items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((c) => (
            <Card key={c.id} className="p-4">
              <p className="text-sm font-medium text-text-primary font-body">{c.firstName} {c.lastName}</p>
              <p className="text-xs text-text-tertiary font-body">{c.email ?? c.phone ?? '—'}</p>
              <div className="mt-2 flex gap-3 text-xs text-text-tertiary font-body">
                <span>Посещений: {c.totalVisits}</span>
                <span>С: {new Date(c.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center"><p className="text-sm text-text-tertiary font-body">Клиенты не найдены</p></Card>
      )}
    </div>
  );
}
