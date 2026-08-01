'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SectionTitle } from '@/components/shared/section-title';
import { MobileBackButton } from '@/components/shared/mobile-back-button';
import { OverviewTab } from '@/components/profile/overview-tab';
import { UpcomingTab } from '@/components/profile/upcoming-tab';
import { AppointmentHistory } from '@/components/profile/appointment-history';
import { SettingsTab } from '@/components/profile/settings-tab';
import { useCurrentUser } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'upcoming' | 'history' | 'settings';

const TABS: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
  {
    key: 'overview',
    label: 'Обзор',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    key: 'upcoming',
    label: 'Мои записи',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    key: 'history',
    label: 'История',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Настройки',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

const TAB_KEYS: Tab[] = TABS.map((t) => t.key);

function getInitialTab(raw: string | null): Tab {
  return TAB_KEYS.includes(raw as Tab) ? (raw as Tab) : 'overview';
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center py-16">
          <ProfileSpinner />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => getInitialTab(searchParams.get('tab')));

  const { user, isLoading, isError } = useCurrentUser();

  // Редирект только при подтверждённой ошибке сессии (AuthProvider уже попытался refresh)
  useEffect(() => {
    if (!isLoading && isError) {
      router.push('/auth/login');
    }
  }, [isError, isLoading, router]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    router.replace(`/profile?tab=${tab}`, { scroll: false });
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-16">
        <ProfileSpinner />
      </div>
    );
  }

  return (
    <div className="py-16 sm:py-20">
      <MobileBackButton />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionTitle
          title="Личный кабинет"
          subtitle="Записи, история и настройки — в одном месте"
          align="left"
          className="mb-6"
        />

        <nav
          aria-label="Разделы кабинета"
          className="mb-8 flex gap-1 border-b border-border overflow-x-auto"
        >
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              aria-current={activeTab === key ? 'page' : undefined}
              className={cn(
                'flex min-h-11 shrink-0 items-center gap-2 px-3 sm:px-4 py-3 text-sm font-body transition-colors border-b-2 -mb-px',
                activeTab === key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
              )}
            >
              <span className={cn(activeTab === key ? 'text-accent' : 'text-text-tertiary')}>
                {icon}
              </span>
              {label}
            </button>
          ))}
        </nav>

        {activeTab === 'overview' && <OverviewTab user={user} />}
        {activeTab === 'upcoming' && <UpcomingTab />}
        {activeTab === 'history' && <AppointmentHistory />}
        {activeTab === 'settings' && <SettingsTab user={user} />}
      </div>
    </div>
  );
}

function ProfileSpinner() {
  return (
    <div className="flex items-center gap-3">
      <svg className="h-5 w-5 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="text-sm text-text-secondary font-body">Загрузка...</span>
    </div>
  );
}
