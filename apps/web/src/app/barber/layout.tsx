import { DashboardSidebar } from '@/components/shared/dashboard-sidebar';
import { MobileDashboardNav } from '@/components/shared/mobile-dashboard-nav';
import { DashboardHeader } from '@/components/shared/dashboard-header';

export default function BarberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg-primary">
      <DashboardSidebar role="barber" />
      <MobileDashboardNav role="barber" />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
        <DashboardHeader />
        {children}
      </main>
    </div>
  );
}
