'use client';

import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-in' | 'scale-in' | 'slide-left';
  delay?: number;
  duration?: number;
  as?: 'div' | 'section' | 'article';
}

const animationMap: Record<NonNullable<RevealProps['animation']>, [string, string]> = {
  'fade-up': ['opacity-0 translate-y-6', 'opacity-100 translate-y-0'],
  'fade-in': ['opacity-0', 'opacity-100'],
  'scale-in': ['opacity-0 scale-95', 'opacity-100 scale-100'],
  'slide-left': ['opacity-0 -translate-x-6', 'opacity-100 translate-x-0'],
};

export function Reveal({
  children,
  className,
  animation = 'fade-up',
  delay = 0,
  duration = 700,
  as: Tag = 'div',
}: RevealProps) {
  const [ref, inView] = useInView({ threshold: 0.05 });
  const pair = animation ? animationMap[animation] : undefined;
  const [hidden, shown] = pair ?? animationMap['fade-up'];

  return (
    <Tag
      ref={ref as unknown as React.Ref<HTMLDivElement>}
      className={cn(
        'transition-all will-change-transform will-change-opacity',
        'ease-out',
        inView ? shown : hidden,
        className,
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}
