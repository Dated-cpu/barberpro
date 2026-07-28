import type { Metadata } from 'next';
import { LegalPage } from '@/components/shared/legal-page';
import { LEGAL_DOCUMENTS } from '@/lib/legal';

const doc = LEGAL_DOCUMENTS.privacy;

export const metadata: Metadata = {
  title: doc.title,
  description: 'Политика конфиденциальности BarberPro — как мы собираем, используем и защищаем ваши персональные данные.',
  openGraph: { title: doc.title, description: 'Политика конфиденциальности BarberPro' },
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPage title={doc.title} version={doc.version}>
      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">1. Общие положения</h3>
      <p>Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок обработки персональных данных пользователей сайта barberpro.ru (далее — «Сайт») и мобильного приложения BarberPro.</p>
      <p>Используя Сайт или сервисы BarberPro, вы выражаете своё согласие с условиями настоящей Политики. Если вы не согласны с условиями — пожалуйста, прекратите использование Сайта и сервисов.</p>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">2. Состав собираемых данных</h3>
      <p>Мы можем собирать следующие категории данных:</p>
      <ul className="list-disc pl-5 sm:pl-6 space-y-1">
        <li>Имя, фамилия, отчество;</li>
        <li>Номер телефона;</li>
        <li>Адрес электронной почты;</li>
        <li>История записей и посещений;</li>
        <li>Предпочтения по услугам и мастерам;</li>
        <li>Технические данные: IP-адрес, тип браузера, операционная система, файлы cookie.</li>
      </ul>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">3. Цели обработки данных</h3>
      <p>Ваши данные используются для:</p>
      <ul className="list-disc pl-5 sm:pl-6 space-y-1">
        <li>Оформления и подтверждения записи на услуги;</li>
        <li>Связи с вами по вопросам записи и обслуживания;</li>
        <li>Направления уведомлений о предстоящих визитах;</li>
        <li>Улучшения качества сервиса;</li>
        <li>Соблюдения требований законодательства РФ.</li>
      </ul>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">4. Хранение и защита данных</h3>
      <p>Мы храним ваши данные на защищённых серверах на территории Российской Федерации. Доступ к данным имеют только уполномоченные сотрудники BarberPro. Мы используем организационные и технические меры для защиты данных от несанкционированного доступа, изменения, раскрытия или уничтожения.</p>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">5. Срок хранения</h3>
      <p>Ваши персональные данные хранятся в течение срока действия договора оказания услуг и 3 лет после его окончания, если иной срок не предусмотрен законодательством РФ. По истечении этого срока данные обезличиваются или удаляются.</p>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">6. Передача данных третьим лицам</h3>
      <p>Мы не передаём ваши персональные данные третьим лицам, за исключением случаев, предусмотренных законодательством РФ. Мы можем передавать данные нашим подрядчикам (платёжным системам, сервисам уведомлений) в объёме, необходимом для оказания услуг.</p>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">7. Ваши права</h3>
      <p>Вы имеете право:</p>
      <ul className="list-disc pl-5 sm:pl-6 space-y-1">
        <li>Запросить информацию об обработке ваших данных;</li>
        <li>Требовать исправления или удаления данных;</li>
        <li>Отозвать согласие на обработку данных;</li>
        <li>Обжаловать действия оператора в уполномоченном органе.</li>
      </ul>
      <p>Для реализации ваших прав направьте запрос на <a href="mailto:privacy@barberpro.ru" className="text-accent hover:underline">privacy@barberpro.ru</a>.</p>
    </LegalPage>
  );
}
