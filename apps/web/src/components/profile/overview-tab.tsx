'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { ProfileHeader, ProfileHeaderSkeleton } from '@/components/profile/profile-header';
import { CustomerStats } from '@/components/profile/customer-stats';
import {
  UpcomingAppointmentCard,
  UpcomingAppointmentCardSkeleton,
  UpcomingAppointmentEmpty,
  type UpcomingAppointment,
} from '@/components/profile/upcoming-appointment-card';
import type { AuthUser } from '@/types/auth';

interface OverviewTabProps {
  user: AuthUser;
}

export function OverviewTab({ user }: OverviewTabProps) {
  const [queryKey, setQueryKey] = useState(0);
  const utils = trpc.useUtils();

  const { data: stats, isPending: statsPending } = trpc.appointment.myStats.useQuery();
  const { data: upcoming, isPending: upcomingLoading } = trpc.appointment.myUpcoming.useQuery();

  const lastVisitServiceIds = stats?.lastVisitServiceIds ?? [];

  const handleCancelled = () => {
    setQueryKey((k) => k + 1);
    utils.appointment.invalidate();
  };

  return (
    <div className="flex flex-col gap-6">
      <ProfileHeader user={user} createdAt={user.createdAt ? String(user.createdAt) : undefined} />

      <CustomerStats />

      {statsPending ? (
        <div className="h-16 rounded-xl bg-bg-elevated animate-pulse" />
      ) : stats?.favoriteService ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-secondary p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary font-body">
                {stats.favoriteService.name}
              </p>
              <p className="text-xs text-text-tertiary font-body">
                Любимая услуга &middot; {stats.favoriteService.count} {plural(stats.favoriteService.count)}
              </p>
            </div>
          </div>
          <Link
            href={`/booking?services=${encodeURIComponent(stats.favoriteService.id)}`}
            className="shrink-0 text-xs text-accent underline-offset-2 hover:underline font-body"
          >
            Записаться
          </Link>
        </div>
      ) : null}

      {upcomingLoading ? (
        <UpcomingAppointmentCardSkeleton />
      ) : upcoming ? (
        <UpcomingAppointmentCard
          key={queryKey}
          appointment={upcoming as unknown as UpcomingAppointment}
          onCancelled={handleCancelled}
        />
      ) : (
        <UpcomingAppointmentEmpty />
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/booking" className="sm:flex-1">
          <Button className="w-full">Записаться снова</Button>
        </Link>
        {lastVisitServiceIds.length > 0 && (
          <Link href={`/booking?services=${encodeURIComponent(lastVisitServiceIds.join(','))}`} className="sm:flex-1">
            <Button variant="secondary" className="w-full">Повторить последнюю запись</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export function OverviewTabSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <ProfileHeaderSkeleton />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-bg-elevated animate-pulse" />
        ))}
      </div>
      <UpcomingAppointmentCardSkeleton />
    </div>
  );
}

function plural(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'раз';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'раза';
  return 'раз';
}
