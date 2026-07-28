import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { TRPCProvider } from '@/trpc/provider';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

const inter = Inter({
  subsets: ['cyrillic', 'latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['cyrillic', 'latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { template: '%s | BarberPro', default: 'BarberPro — Премиальный барбершоп' },
  description: 'Премиальный барбершоп в Москве. Стрижки, бритьё, укладка. Запись онлайн 24/7.',
  metadataBase: new URL('https://barberpro.ru'),
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'BarberPro',
    title: 'BarberPro — Премиальный барбершоп',
    description: 'Премиальный барбершоп в Москве. Стрижки, бритьё, укладка. Запись онлайн 24/7.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: 'BarberPro',
              description: 'Премиальный барбершоп в Москве',
              address: { '@type': 'PostalAddress', streetAddress: 'ул. Тверская, 15', addressLocality: 'Москва', addressCountry: 'RU' },
              telephone: '+79991234567',
              openingHours: 'Mo-Su 09:00-21:00',
            }),
          }}
        />
      </head>
      <body className="bg-bg-primary text-text-primary font-body antialiased">
        <TRPCProvider>
          <ToastProvider>{children}</ToastProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
