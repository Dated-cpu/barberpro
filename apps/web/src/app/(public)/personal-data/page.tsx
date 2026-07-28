import type { Metadata } from 'next';
import { LegalPage } from '@/components/shared/legal-page';
import { LEGAL_DOCUMENTS } from '@/lib/legal';

const doc = LEGAL_DOCUMENTS.personalData;

export const metadata: Metadata = {
  title: doc.title,
  description: 'Политика обработки персональных данных BarberPro — порядок сбора, хранения и обработки персональных данных клиентов.',
  openGraph: { title: doc.title, description: 'Политика обработки персональных данных BarberPro' },
  alternates: { canonical: '/personal-data' },
};

export default function PersonalDataPage() {
  return (
    <LegalPage title={doc.title} version={doc.version}>
      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">1. Оператор персональных данных</h3>
      <p>Индивидуальный предприниматель, осуществляющий деятельность под брендом BarberPro (далее — «Оператор»), является оператором персональных данных и обрабатывает их в соответствии с Федеральным законом № 152-ФЗ «О персональных данных».</p>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">2. Правовые основания обработки</h3>
      <p>Обработка персональных данных осуществляется на основании:</p>
      <ul className="list-disc pl-5 sm:pl-6 space-y-1">
        <li>Конституции Российской Федерации;</li>
        <li>Федерального закона № 152-ФЗ «О персональных данных»;</li>
        <li>Пользовательского соглашения BarberPro;</li>
        <li>Согласия Пользователя на обработку персональных данных.</li>
      </ul>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">3. Категории обрабатываемых данных</h3>
      <p>Оператор обрабатывает следующие категории персональных данных:</p>
      <ul className="list-disc pl-5 sm:pl-6 space-y-1">
        <li>Общие персональные данные (имя, телефон, email);</li>
        <li>Данные о записях и посещениях;</li>
        <li>Обезличенные данные (статистика посещений, предпочтения).</li>
      </ul>
      <p>Оператор не обрабатывает специальные категории персональных данных (расовую, национальную принадлежность, политические взгляды, религиозные убеждения, состояние здоровья).</p>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">4. Способы обработки</h3>
      <p>Обработка персональных данных производится с использованием средств автоматизации и без использования средств автоматизации (смешанная обработка). При обработке обеспечиваются: запись, систематизация, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передача, обезличивание, блокирование, удаление, уничтожение данных.</p>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">5. Трансграничная передача</h3>
      <p>Оператор не осуществляет трансграничную передачу персональных данных. Все данные хранятся на серверах, расположенных на территории Российской Федерации.</p>

      <h3 className="text-base sm:text-lg font-semibold text-text-primary font-display">6. Права субъекта персональных данных</h3>
      <p>Субъект персональных данных имеет право:</p>
      <ul className="list-disc pl-5 sm:pl-6 space-y-1">
        <li>Получать информацию об обработке его данных;</li>
        <li>Требовать уточнения, блокирования или уничтожения данных;</li>
        <li>Отозвать согласие на обработку;</li>
        <li>Обжаловать действия Оператора в Роскомнадзоре.</li>
      </ul>
      <p>Запросы направляйте на <a href="mailto:privacy@barberpro.ru" className="text-accent hover:underline">privacy@barberpro.ru</a>. Ответ предоставляется в течение 30 дней.</p>
    </LegalPage>
  );
}
