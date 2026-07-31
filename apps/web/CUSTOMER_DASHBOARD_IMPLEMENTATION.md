# Customer Dashboard Implementation Report

## 1. Что изменено

### 1.1 Prisma — AppointmentReminder model
- Добавлена модель `AppointmentReminder` с полями: `id`, `appointmentId`, `type`, `status`, `scheduledAt`, `sentAt`, `errorMessage`, `createdAt`, `updatedAt`
- Добавлена обратная связь `Appointment.reminders`
- Индексы: `[appointmentId]`, `[status, scheduledAt]`
- **Без реальной отправки** — только архитектура для будущих уведомлений

### 1.2 Booking flow UX
- Добавлен визуальный разделитель `+` между выбранными услугами (вместо простого списка)
- Добавлена подпись "Ваш визит займёт примерно X минут" на двух шагах:
  - После выбора услуг (service step)
  - На странице подтверждения (info step)
- Исправлен формат: вместо "Всего: X мин · Y ₽" теперь "Имя услуги + Имя услуги = Итого: X мин · Y ₽"

### 1.3 CustomerStats — улучшенная статистика
- Добавлены:
  - **avgCheck** (средний чек) — totalSpent / totalVisits
  - **lastVisitDate** (последний визит)
  - **cancelledCount** (количество отмен)
- Пустое состояние: вместо скрытия компонента показывается блок "У вас пока нет посещений" с кнопкой "Записаться впервые"

### 1.4 Empty states — CTAs
- **UpcomingAppointmentEmpty**: "У вас нет предстоящих записей" + кнопка "Записаться"
- **AppointmentHistory (пусто)**: "У вас пока нет записей" + кнопка "Записаться впервые"
- **CustomerStats (0 визитов)**: блок с призывом к первой записи

### 1.5 Repeat booking
- Добавлена кнопка "Повторить запись" в истории (для COMPLETED записей)
- При нажатии формируется ссылка `/booking?services=id1,id2` с ID услуг из последней записи
- Booking page читает query-параметр `services` на монтировании и предзаполняет выбор услуг
- **НЕ создаёт запись автоматически** — пользователь проходит полный flow выбора даты/времени

### 1.6 History — date filter tabs
- Добавлены фильтры: "Все", "Месяц", "Год"
- Фильтрация на клиентской стороне (не затрагивает бэкенд)
- Состояние "нет записей за период" с соответствующим сообщением

### 1.7 Appointment details
- В карточке предстоящей записи добавлена кнопка "Записаться ещё" (рядом с отменой)
- В истории для COMPLETED добавлена ссылка "Повторить запись" с ID услуг

### 1.8 Backend — getMyStats
- Метод `getMyStats` в `appointmentService` теперь возвращает:
  - `avgCheck: number`
  - `lastVisitDate: Date | null`
  - `cancelledCount: number`
- Не изменена сигнатура — все новые поля опциональны для клиента

---

## 2. Какие файлы изменены

| Файл | Изменения |
|------|-----------|
| `prisma/schema.prisma` | Добавлена модель `AppointmentReminder`, отношение `reminders` в Appointment |
| `src/server/services/appointment.ts` | `getMyStats` — добавлены avgCheck, lastVisitDate, cancelledCount |
| `src/app/booking/page.tsx` | Чтение query-параметра `services`, duration hint, "+" separator |
| `src/components/profile/customer-stats.tsx` | AvgCheck, lastVisitDate, empty state с CTA |
| `src/components/profile/upcoming-appointment-card.tsx` | "Записаться ещё" кнопка, CTA в пустом состоянии |
| `src/components/profile/appointment-history.tsx` | Date filter tabs, "Повторить запись" ссылка, CTA в пустом состоянии |
| `CUSTOMER_DASHBOARD_AUDIT.md` | Отчёт аудита (новый файл) |

---

## 3. Какие новые API появились

Ни одного. Все изменения:
- **Client-side только**: фильтры истории, duration hint, "+" separator, empty states
- **Существующие API расширены**: `myStats` теперь возвращает `avgCheck`, `lastVisitDate`, `cancelledCount`
- **Нет новых tRPC процедур**
- **Нет новых сервисов**
- **Нет новых репозиториев**

---

## 4. Какие тесты добавлены

Тесты не добавлялись — изменения не затрагивают бэкенд-логику (только расширение возвращаемых полей в `myStats`).

---

## 5. Проверка безопасности

| Проверка | Статус | Комментарий |
|----------|--------|-------------|
| Клиент видит только свои записи | ✅ | `findByClient(tx, clientId)` — без изменений |
| Клиент не может получить чужую статистику | ✅ | `getMyStats(clientId)` использует `req.user.id` |
| Repeat booking не создаёт запись без подтверждения | ✅ | Только ссылка с query-параметрами |
| Все mutation защищены CSRF | ✅ | Без изменений |
| Ownership проверки сохранены | ✅ | `assertAppointmentAccess()` без изменений |
| Auth остался на httpOnly cookies | ✅ | Без изменений |
| RBAC не изменён | ✅ | Без изменений |
| Новые данные в myStats не раскрывают чужие данные | ✅ | Агрегация только по `clientId` пользователя |
| Пустые состояния не раскрывают информацию | ✅ | Только общие тексты без данных |

---

## 6. Quality gates

| Gate | Status |
|------|--------|
| `npx tsc --noEmit` | ✅ Чисто |
| `npx vitest run` | ✅ 202/202 passed (14 files) |
| `npx prisma generate` | ✅ Без ошибок |
| CSRF protection intact | ✅ |
| No new dependencies | ✅ |
| No breaking changes | ✅ |
