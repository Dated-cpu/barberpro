import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'shimmer',
        variant === 'circle' && 'rounded-full',
        variant === 'text' && 'h-4 rounded',
        variant === 'rect' && 'rounded-xl',
        className,
      )}
    />
  );
}

export function ServiceSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-elevated p-6">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="mt-2 h-10 w-full" />
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-elevated p-6">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="h-10 w-10" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}

export function SlotSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-24" />
      ))}
    </div>
  );
}
