'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function NavList({ items, basePath }: { items: NavItem[]; basePath: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Навигация">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== basePath && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 font-body',
              isActive
                ? 'bg-accent-muted text-accent'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
