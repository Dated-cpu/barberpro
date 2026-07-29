import type { Metadata } from 'next';
import { LegalPage } from '@/components/shared/legal-page';
import { LEGAL_DOCUMENTS } from '@/lib/legal';

const doc = LEGAL_DOCUMENTS.bookingRules;

export const metadata: Metadata = {
  title: doc.title,
  description: 'Правила записи и отмены BarberPro — условия бронирования, отмены и переноса записи в барбершоп.',
  openGraph: { title: doc.title, description: 'Правила записи и отмены BarberPro' },
  alternates: { canonical: '/booking-rules' },
};

export default function BookingRulesPage() {
  return (
    <LegalPage title={doc.title} version={doc.version}>
      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">1. Запись на услугу</h3>
      <p>Запись на услуги BarberPro осуществляется онлайн через Сайт, по телефону, через мессенджеры или непосредственно в барбершопе. Онлайн-запись доступна 24/7. Подтверждение записи направляется на указанный номер телефона.</p>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">2. Подтверждение записи</h3>
      <p>После бронирования вы получите уведомление с деталями записи. Если в течение 30 минут после бронирования вы не получили подтверждение — пожалуйста, свяжитесь с нами. Мы оставляем за собой право отменить запись при отсутствии подтверждения.</p>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">3. Отмена и перенос</h3>
      <ul className="list-disc pl-5 sm:pl-6 space-y-1">
        <li>Отмена записи возможна не позднее чем за 2 часа до начала;</li>
        <li>Перенос записи осуществляется не позднее чем за 4 часа до начала;</li>
        <li>При опоздании более чем на 15 минут время услуги сокращается;</li>
        <li>При опоздании более чем на 30 минут запись может быть отменена.</li>
      </ul>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">4. Неявка (No-show)</h3>
      <p>Две неотменённые неявки подряд являются основанием для блокировки возможности онлайн-записи. Восстановление доступа возможно только после личного визита в барбершоп.</p>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">5. Оплата</h3>
      <p>Оплата услуг производится после оказания услуги наличными или банковской картой в барбершопе. Предоплата для отдельных услуг производится по согласованию. Возврат предоплаты осуществляется в полном объёме при отмене записи за 2 часа до начала.</p>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">6. Особые условия</h3>
      <p>Мы гарантируем, что услуга будет оказана заявленным мастером в выбранное время. В случае болезни мастера запись переносится на другое время или отменяется. Дети до 12 лет допускаются в барбершоп только в сопровождении взрослых.</p>
    </LegalPage>
  );
}
