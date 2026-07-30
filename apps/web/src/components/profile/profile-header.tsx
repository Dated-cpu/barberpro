import type { AuthUser } from '@/types/auth';

interface ProfileHeaderProps {
  user: AuthUser;
  createdAt?: string;
}

export function ProfileHeader({ user, createdAt }: ProfileHeaderProps) {
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const registered = createdAt
    ? new Date(createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="flex items-center gap-4 sm:gap-5">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-bg-elevated text-xl font-semibold text-accent font-display sm:h-20 sm:w-20 sm:text-2xl">
        {initials}
      </div>
      <div className="min-w-0">
        <h1 className="truncate font-display text-xl font-bold text-text-primary sm:text-2xl">
          {user.firstName} {user.lastName}
        </h1>
        <p className="truncate text-sm text-text-secondary font-body">
          {user.email || user.phone}
        </p>
        {registered ? (
          <p className="mt-0.5 text-xs text-text-tertiary font-body">
            Клиент с {registered}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="flex items-center gap-4 sm:gap-5 animate-pulse">
      <div className="h-16 w-16 rounded-full bg-bg-elevated sm:h-20 sm:w-20" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-48 rounded bg-bg-elevated sm:h-6" />
        <div className="h-4 w-32 rounded bg-bg-elevated" />
        <div className="h-3 w-24 rounded bg-bg-elevated" />
      </div>
    </div>
  );
}
