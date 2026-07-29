'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AdminClients() {
  const [search, setSearch] = useState('');

  const { data, isFetching } = trpc.admin.listAllClients.useQuery({ search: search || undefined });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <Input id="client-search" placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
      </div>

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
