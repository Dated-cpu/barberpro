import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
