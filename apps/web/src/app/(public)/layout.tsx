import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-14 sm:pt-16">{children}</main>
      <Footer />
    </div>
  );
}
