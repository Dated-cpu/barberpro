import type { Metadata } from 'next';
import { LegalPage } from '@/components/shared/legal-page';
import { LEGAL_DOCUMENTS } from '@/lib/legal';

const doc = LEGAL_DOCUMENTS.cookies;

export const metadata: Metadata = {
  title: doc.title,
  description: 'Политика использования cookies BarberPro — какие cookies мы используем и как вы можете управлять ими.',
  openGraph: { title: doc.title, description: 'Политика использования cookies BarberPro' },
  alternates: { canonical: '/cookies' },
};

export default function CookiesPage() {
  return (
    <LegalPage title={doc.title} version={doc.version}>
      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">1. Что такое cookies</h3>
      <p>Cookies — это небольшие текстовые файлы, которые сохраняются на вашем устройстве при посещении Сайта. Они позволяют Сайту запоминать ваши действия и предпочтения, чтобы вам не приходилось вводить их заново при каждом визите.</p>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">2. Какие cookies мы используем</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-semibold text-text-primary">Тип</th>
              <th className="py-2 pr-4 font-semibold text-text-primary">Назначение</th>
              <th className="py-2 font-semibold text-text-primary">Срок</th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            <tr className="border-b border-border">
              <td className="py-2 pr-4">Необходимые</td>
              <td className="py-2 pr-4">Обеспечение работы Сайта, безопасность</td>
              <td className="py-2">Сессия</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4">Функциональные</td>
              <td className="py-2 pr-4">Запоминание предпочтений и настроек</td>
              <td className="py-2">1 год</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4">Аналитические</td>
              <td className="py-2 pr-4">Статистика посещений, поведение на Сайте</td>
              <td className="py-2">2 года</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">3. Управление cookies</h3>
      <p>Вы можете управлять cookies через настройки вашего браузера. Отключение некоторых типов cookies может повлиять на функциональность Сайта. Инструкции по управлению cookies:</p>
      <ul className="list-disc pl-5 sm:pl-6 space-y-1">
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/ru/kb/udalenie-kuki" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/ru-ru/HT201265" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Safari</a></li>
        <li><a href="https://support.microsoft.com/ru-ru/help/17442/windows-internet-explorer-delete-manage-cookies" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Internet Explorer / Edge</a></li>
      </ul>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">4. Сторонние cookies</h3>
      <p>Мы используем сервисы Яндекс.Метрики для сбора статистики. Эти сервисы могут устанавливать собственные cookies. Мы не контролируем cookies третьих лиц. Рекомендуем ознакомиться с политиками конфиденциальности соответствующих сервисов.</p>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">5. Обновления политики cookies</h3>
      <p>Мы можем обновлять настоящую Политику использования cookies. Рекомендуем периодически проверять эту страницу. Продолжая использование Сайта после изменений, вы принимаете обновлённую Политику.</p>
    </LegalPage>
  );
}
