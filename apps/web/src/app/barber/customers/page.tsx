'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomersPage() {
  const [search, setSearch] = useState('');

  const { data, isFetching } = trpc.customers.list.useQuery({ search: search || undefined });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-primary">Клиенты</h1>
        <Input
          id="search-customers"
          placeholder="Поиск по имени или телефону..."
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isFetching ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : data?.items && data.items.length > 0 ? (
        <div className="flex flex-col gap-2">
          {data.items.map((c) => (
            <Card key={c.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent font-body">
                  {c.firstName[0]}{c.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary font-body">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-text-tertiary font-body">{c.phone ?? 'нет телефона'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge>{c.totalVisits} записей</Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-sm text-text-tertiary font-body">Клиенты не найдены</p>
        </Card>
      )}
    </div>
  );
}
