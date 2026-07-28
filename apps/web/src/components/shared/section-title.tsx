import { cn } from '@/lib/utils';
import { GoldThread } from './gold-thread';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
  id?: string;
}

export function SectionTitle({ title, subtitle, align = 'center', className, id }: SectionTitleProps) {
  return (
    <div className={cn(
      'flex flex-col gap-4 mb-12',
      align === 'center' && 'items-center text-center',
      align === 'left' && 'items-start',
      className,
    )}>
      <h2 id={id} className="font-display text-3xl font-bold text-ivory sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <GoldThread className={cn('w-16', align === 'center' && 'mx-auto')} />
      {subtitle ? (
        <p className="max-w-xl text-base text-stone font-body leading-relaxed">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
