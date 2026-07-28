# Notification System — Architecture Document

> **Проект:** BarberPro (SaaS)
> **Статус:** Draft / v0.1
> **Стек:** Next.js 15, tRPC, Prisma, PostgreSQL, Redis, BullMQ

---

## 1. Общая архитектура

```
Business Event (tRPC mutation / internal service)
       │
       ▼
┌──────────────────────┐
│   Event Outbox (DB)  │  ← пишется в той же транзакции, что и бизнес-операция
│   model Event        │
└──────┬───────────────┘
       │  Outbox Worker (cron / poll)
       ▼
┌──────────────────────┐
│   Notification       │  ← определяет тип, канал, получателя, рендерит шаблон
│   Service            │
└──────┬───────────────┘
       │  определяет каналы доставки
       ▼
┌──────────────────────────────────────────────┐
│  BullMQ Queues                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  email   │ │ telegram │ │   push   │     │
│  │  queue   │ │  queue   │ │  queue   │     │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘     │
└───────┼────────────┼────────────┼────────────┘
        ▼            ▼            ▼
   Email API    Telegram Bot   Web Push
   (SendGrid)   (Bot API)      (Web Push API)
```

### 1.1 Принципы

| Принцип | Описание |
|---------|----------|
| **Transactional Outbox** | Событие пишется в БД в той же транзакции, что и бизнес-операция. Гарантия at-least-once без distributed transactions. |
| **Idempotent Consumers** | Каждый worker идемпотентен — повторная обработка того же события безопасна. |
| **Fail-isolated Channels** | Падение email-канала не влияет на отправку Telegram. Каждый канал — отдельная очередь. |
| **Channel as Plugin** | Добавление нового канала (WhatsApp, VK) — новый worker + модель канала. Без изменения ядра. |

### 1.2 Почему Outbox + Queue, а не прямо в очередь

1. **Надёжность:** Если Redis недоступен, бизнес-операция не потеряется — событие останется в БД.
2. **Ordering:** Можно гарантировать порядок обработки событий одной сущности (по aggregateId).
3. **Audit:** Все события хранятся в БД — можно переиграть, проанализировать, построить отчёт.
4. **Backpressure:** Если очередь переполнена, события копятся в БД, а не теряются.

---

## 2. Очереди BullMQ

### 2.1 Общая конфигурация

```typescript
// src/server/queue/connection.ts
import { IORedisConnection } from 'bullmq';

// Connection shared across all queues
// Использует отдельный Redis db (1) для очередей, чтобы не мешать кэшу
export const connection = new IORedisConnection({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  db: 1,
  maxRetriesPerRequest: null,
});
```

### 2.2 Очереди

#### 2.2.1 `notification` queue

| Поле | Значение |
|------|----------|
| **Назначение** | Главный диспетчер: получает событие из outbox, определяет каналы доставки, создаёт задачи в конкретные очереди |
| **Concurrency** | 5 |
| **Retry** | 3 попытки, exponential backoff: 1s → 5s → 30s |
| **DLQ (Dead Letter Queue)** | `notification-dlq` — после исчерпания retry |
| **Priority** | High: appointment reminders, Low: marketing |
| **Job data** | `{ eventId, notificationType, userId, channel, templateData }` |
| **RemoveOnComplete** | 1000 (держать историю последних 1000 успешных) |
| **RemoveOnFail** | 500 (держать историю последних 500 упавших) |

#### 2.2.2 `email` queue

| Поле | Значение |
|------|----------|
| **Назначение** | Отправка email через SendGrid (или альтернативный провайдер) |
| **Concurrency** | 3 (SendGrid rate limit ~10 req/s) |
| **Retry** | 5 попыток: 30s → 2m → 10m → 1h → 6h |
| **DLQ** | `email-dlq` — неотправляемые письма |
| **Job data** | `{ to, subject, html, templateId?, attachments? }` |
| **RemoveOnComplete** | 1000 |
| **RemoveOnFail** | 200 |

#### 2.2.3 `telegram` queue

| Поле | Значение |
|------|----------|
| **Назначение** | Отправка сообщений в Telegram через Bot API |
| **Concurrency** | 10 (Telegram Bot API ~30 msg/s на бота; редко упираемся) |
| **Retry** | 3 попытки: 5s → 30s → 5m |
| **DLQ** | `telegram-dlq` |
| **Job data** | `{ chatId, text, parseMode?, replyMarkup? }` |
| **RemoveOnComplete** | 1000 |
| **RemoveOnFail** | 200 |

#### 2.2.4 `push` queue

| Поле | Значение |
|------|----------|
| **Назначение** | Web Push уведомления (Service Worker + Push API) |
| **Concurrency** | 5 |
| **Retry** | 3 попытки: 10s → 1m → 10m |
| **DLQ** | `push-dlq` |
| **Job data** | `{ subscription, payload, ttl? }` |
| **RemoveOnComplete** | 500 |
| **RemoveOnFail** | 100 |

### 2.3 Структура файлов

```
src/server/queue/
├── connection.ts          # Redis connection (shared)
├── index.ts               # Экспорт всех очередей
├── queues/
│   ├── notification.queue.ts
│   ├── email.queue.ts
│   ├── telegram.queue.ts
│   └── push.queue.ts
├── workers/
│   ├── notification.worker.ts    # Outbox → Notification Service
│   ├── email.worker.ts
│   ├── telegram.worker.ts
│   └── push.worker.ts
└── dlq/
    └── dlq-handler.ts     # Обработка DLQ: алерт, ручной retry, логирование
```

### 2.4 DLQ Handler

Jobs в DLQ требуют человеческого внимания:

1. **Alert:** При падении job в DLQ → уведомление администратору (Telegram/Slack).
2. **Dashboard:** UI-страница `admin/notifications/failed` с фильтром по очереди, типу, дате.
3. **Manual Retry:** Кнопка "Повторить" → добавляет job обратно в основную очередь.
4. **Auto-cleanup:** Jobs старше 30 дней из DLQ удаляются.

---

## 3. Event Flow

### 3.1 Структура события в outbox

```typescript
// model Event (существует в schema.prisma)
// Гарантия: at-least-once delivery
// Идемпотентность: на уровне получателя (см. раздел 6)
```

### 3.2 Описание событий

#### 3.2.1 AppointmentCreated

| Поле | Значение |
|------|----------|
| **Триггер** | Клиент записался на услугу (public booking или barber manual create) |
| **Payload** | `{ appointmentId, clientId, barberId, serviceName, startTime, branchName }` |
| **Получатели** | Клиент (подтверждение), Барбер (новая запись) |
| **Каналы** | Клиент: Telegram / Email. Барбер: Telegram / Web Push / In-App |
| **Шаблон (клиент)** | `✓ Запись подтверждена! {serviceName} {date} в {time}. {barberName}, {branchAddress}` |
| **Шаблон (барбер)** | `✂ Новая запись: {clientName} на {serviceName} в {time}` |
| **Priority** | High |
| **Idempotency key** | `appointment.created.{appointmentId}.{userId}.{channel}` |

#### 3.2.2 AppointmentConfirmed

| Поле | Значение |
|------|----------|
| **Триггер** | Барбер подтвердил запись (PENDING → CONFIRMED) |
| **Payload** | `{ appointmentId, clientId, barberId, serviceName, startTime }` |
| **Получатели** | Клиент |
| **Каналы** | Telegram / Email / SMS |
| **Шаблон** | `✅ {barberName} подтвердил запись на {date} в {time}. Ждём вас!` |
| **Idempotency key** | `appointment.confirmed.{appointmentId}.{channel}` |

#### 3.2.3 AppointmentCancelled

| Поле | Значение |
|------|----------|
| **Триггер** | Отмена записи (клиентом, барбером, системой) |
| **Payload** | `{ appointmentId, cancelledBy, reason?, clientId, barberId, serviceName, startTime }` |
| **Получатели** | Клиент (подтверждение отмены), Барбер (слот освободился) |
| **Каналы** | Клиент: Telegram / Email. Барбер: Telegram / Web Push |
| **Шаблон (клиент)** | `✕ Запись на {date} в {time} отменена. {cancelledBy === 'barber' ? 'Приносим извинения' : ''}` |
| **Шаблон (барбер)** | `Слот освободился: {time} — {clientName} отменил запись` |
| **Idempotency key** | `appointment.cancelled.{appointmentId}.{userId}.{channel}` |

#### 3.2.4 AppointmentReminder

| Поле | Значение |
|------|----------|
| **Триггер** | Cron-задача за 24h, 2h и 15min до начала |
| **Payload** | `{ appointmentId, clientId, barberId, serviceName, startTime, remindAt }` |
| **Получатели** | Клиент |
| **Каналы** | Telegram / Email / SMS (SMS только за 2h) |
| **Шаблон** | `⏰ Напоминание: {serviceName} завтра в {time}. {barberName}, {branchAddress}` |
| **Rate limit** | Не чаще 1 напоминания в час на один appointment |
| **Idempotency key** | `appointment.reminder.{appointmentId}.{remindAt}.{channel}` |

#### 3.2.5 ReviewCreated

| Поле | Значение |
|------|----------|
| **Триггер** | Клиент оставил отзыв |
| **Payload** | `{ reviewId, appointmentId, clientId, barberId, rating, text? }` |
| **Получатели** | Барбер (уведомление), Админ (модерация) |
| **Каналы** | Барбер: Telegram / In-App. Админ: Email |
| **Шаблон (барбер)** | `⭐ Новый отзыв! {rating}/5 — {text ? text.slice(0,100) : 'без текста'}` |
| **Шаблон (админ)** | `Новый отзыв требует модерации: {rating}/5 от {clientName}` |
| **Idempotency key** | `review.created.{reviewId}.{userId}.{channel}` |

#### 3.2.6 UserRegistered

| Поле | Значение |
|------|----------|
| **Триггер** | Новая регистрация пользователя |
| **Payload** | `{ userId, email?, phone?, firstName, role, source? }` |
| **Получатели** | Админ (для новых барберов), Клиент (приветствие) |
| **Каналы** | Админ: Email. Клиент: Email / Telegram |
| **Шаблон (клиент)** | `👋 {firstName}, добро пожаловать в BarberPro!` |
| **Шаблон (админ)** | `Новый {role}: {firstName} {lastName}` |
| **Idempotency key** | `user.registered.{userId}.{channel}` |

### 3.3 Тайминги напоминаний

```
24h → Telegram / Email
 2h → Telegram / Email / SMS
15m → Telegram / Push (только если клиент на сайте)
```

Каждый reminder — отдельное событие в outbox с уникальным `remindAt` в payload.

---

## 4. Каналы

### 4.1 Telegram

| Поле | Значение |
|------|----------|
| **Когда используется** | Основной канал для клиентов и барберов. Мгновенная доставка, высокий open rate. |
| **Необходимые данные** | `telegramChatId` в профиле пользователя. Связывается через `/start` при входе. |
| **Ограничения** | Bot API: 30 msg/s на бота. Сообщение ≤ 4096 символов. Markdown/HTML parse mode. |
| **Требования** | Поддержка webhook (setWebhook). Retry на 429 (Flood control) с exponential backoff. |
| **Падение** | Если `telegramChatId` не задан → fallback на Email с пометкой "Telegram недоступен". |

#### Привязка Telegram

1. Пользователь нажимает "Связать Telegram" в настройках.
2. Бэкенд генерирует одноразовый код (6 цифр, TTL 5 минут).
3. Пользователь отправляет `/start <code>` боту.
4. Бот сохраняет `telegramChatId` в профиль.
5. Начиная с этого момента — уведомления приходят в Telegram.

### 4.2 Email

| Поле | Значение |
|------|----------|
| **Когда используется** | Подтверждение регистрации, детали записи, сброс пароля, маркетинговые рассылки. Fallback для всех каналов. |
| **Необходимые данные** | `email` пользователя (обязательное поле). |
| **Ограничения** | SendGrid: 100 emails/day free, платный — до 100k/day. Open rate ~20-30%. |
| **Требования** | HTML-шаблоны (react-email или handlebars). Tracking open/click (опционально). |
| **Падение** | Bounce → пометить email как невалидный, уведомить пользователя. |

### 4.3 Web Push

| Поле | Значение |
|------|----------|
| **Когда используется** | Клиент на сайте/в PWA. Напоминания о начале записи. |
| **Необходимые данные** | Push subscription (endpoint, keys, auth). VAPID keys для авторизации. |
| **Ограничения** | Браузер сам управляет видимостью. Только когда пользователь дал разрешение. |
| **Требования** | Service Worker в Next.js. Push API. Notification API для клик-обработчика. |
| **Падение** | Expired subscription → удалить подписку, не уведомлять пользователя. |

### 4.4 SMS (будущее)

| Поле | Значение |
|------|----------|
| **Когда используется** | Критические уведомления: напоминание за 2h, отмена записи. |
| **Необходимые данные** | `phone` пользователя. |
| **Ограничения** | Дорого (~3-5 руб/сообщение). 160 символов/сообщение (кириллица — 70). |
| **Требования** | Провайдер (Twilio, SMSC). Только opt-in. Настраиваемый лимит на пользователя/месяц. |
| **Падение** | Не отправлено → залогировать. Fallback на Telegram/Email. |

---

## 5. Database изменения

### 5.1 Новые модели

#### 5.1.1 NotificationTemplate

```prisma
/// Шаблон уведомления — определяет содержимое для комбинации type + channel + locale
model NotificationTemplate {
  id             String   @id @default(uuid()) @db.Uuid
  notificationType NotificationType
  channel        String   // "telegram", "email", "push", "sms"
  locale         String   @default("ru") // "ru", "en"
  subject        String?  // для email: тема письма
  title          String?  // для push: заголовок
  body           String   // тело сообщения с {{variables}}
  version        Int      @default(1)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now()) @db.Timestamptz
  updatedAt      DateTime @updatedAt @db.Timestamptz

  @@unique([notificationType, channel, locale, version])
  // Один активный шаблон для комбинации; версии для постепенных изменений

  @@index([notificationType, channel, locale, isActive])
  @@map("notification_templates")
}
```

#### 5.1.2 NotificationPreference

```prisma
/// Настройки уведомлений пользователя: какие каналы и для каких типов включены
model NotificationPreference {
  id               String           @id @default(uuid()) @db.Uuid
  userId           String           @db.Uuid
  channel          String           // "telegram", "email", "push", "sms"
  notificationType NotificationType
  enabled          Boolean          @default(true)
  quietHoursStart  String?          // "22:00" — тихий час: не беспокоить
  quietHoursEnd    String?          // "09:00"
  createdAt        DateTime         @default(now()) @db.Timestamptz
  updatedAt        DateTime         @updatedAt @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, channel, notificationType])
  // Одна настройка на пользователя + канал + тип

  @@index([userId])
  @@map("notification_preferences")
}

/// Каналы связи пользователя (как с ним связаться)
model UserChannel {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  channel   String   // "telegram", "email", "push", "sms", "phone"
  value     String   // chatId, email, phone, push subscription endpoint
  isPrimary Boolean  @default(false)
  isVerified Boolean @default(false)
  metadata  Json?    @db.JsonB // push keys, device info, bot username
  createdAt DateTime @default(now()) @db.Timestamptz
  updatedAt DateTime @updatedAt @db.Timestamptz
  deletedAt DateTime? @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, channel])
  // Один канал на пользователя

  @@index([channel, value])
  // Поиск пользователя по telegram chatId / email / phone

  @@map("user_channels")
}
```

#### 5.1.3 NotificationAttempt

```prisma
/// Аудит каждой попытки отправки уведомления через каждый канал
model NotificationAttempt {
  id              String   @id @default(uuid()) @db.Uuid
  notificationId  String   @db.Uuid
  channel         String   // "telegram", "email", "push", "sms"
  status          String   // "pending", "sent", "delivered", "failed", "bounced"
  attemptNumber   Int      @default(1)
  requestPayload  Json?    @db.JsonB
  responsePayload Json?    @db.JsonB // ответ внешнего API (без secrets)
  errorMessage    String?
  errorCode       String?  // "rate_limited", "invalid_recipient", "timeout", "provider_error"
  sentAt          DateTime? @db.Timestamptz
  deliveredAt     DateTime? @db.Timestamptz
  failedAt        DateTime? @db.Timestamptz
  createdAt       DateTime @default(now()) @db.Timestamptz

  notification Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)

  @@index([notificationId, attemptNumber])
  // Все попытки для одного уведомления

  @@index([status, createdAt])
  // Мониторинг: упавшие попытки за период

  @@index([errorCode])
  // Статистика типов ошибок

  @@map("notification_attempts")
}
```

### 5.2 Изменения в модели Notification (существует)

Добавить поля:

| Поле | Назначение |
|------|------------|
| `idempotencyKey` | `String? @unique` — ключ идемпотентности (см. раздел 6) |
| `templateVersion` | `Int @default(1)` — версия шаблона на момент отправки |
| `channelPriority` | `Int @default(0)` — порядок отправки по каналам |
| `scheduledFor` | `DateTime?` — отложенная отправка (для reminders) |
| `completedChannels` | `String[] @default([])` — список каналов, куда уже отправили |

### 5.3 Схема связи

```
User (1) ──── (N) Notification
User (1) ──── (N) NotificationPreference
User (1) ──── (N) UserChannel
Notification (1) ──── (N) NotificationAttempt
NotificationTemplate — независимая справочная таблица
```

---

## 6. Idempotency

### 6.1 Почему это критично

Outbox pattern гарантирует **at-least-once** delivery. Без идемпотентности:
- Клиент получит 2 одинаковых SMS
- Telegram-бот отправит 3 одинаковых сообщения
- Уведомление будет создано 2 раза в БД

### 6.2 Уровни защиты

#### 6.2.1 DB-уровень: idempotencyKey

```typescript
// При создании Notification:
const idempotencyKey = `${eventType}.${aggregateId}.${userId}.${channel}`;
// Пример: "appointment.created.123e4567-uuid.client-id.telegram"

// UNIQUE constraint на idempotencyKey в таблице Notification
// Вторая попытка INSERT с тем же ключом → Prisma P2002 → ignore
```

#### 6.2.2 Queue-уровень: deduplication

```typescript
// BullMQ: removeOnFail + deduplication
// Используем jobId = idempotencyKey

await notificationQueue.add('send', jobData, {
  jobId: idempotencyKey,  // BullMQ не добавит дубль
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 500 },
});
```

#### 6.2.3 Channel-уровень

Каждый канал проверяет `externalId` в Notification:
- Email: SendGrid `custom_args` с `notificationId`; при вебхуке обновляем статус
- Telegram: `reply_to_message_id` для threading; проверка `externalId` в нашей БД
- Push: проверка `subscription.endpoint` + `idempotencyKey`

### 6.3 Что происходит при дубликате

| Сценарий | Действие |
|----------|----------|
| Outbox worker читает то же событие дважды | Первый раз — OK. Второй — `idempotencyKey` уже существует в Notification → skip |
| BullMQ получает тот же job дважды | `jobId` уже существует → BullMQ auto-deduplicates |
| Worker падает после отправки, но до отметки sent | Job retry → канал проверяет `externalId` / idempotencyKey и не отправляет повторно |
| Очередь перезапускается с незавершёнными jobs | Unfinished jobs автоматически retry с флагом `attemptNumber`; channel worker проверяет `idempotencyKey` |

### 6.4 Idempotency key generation

```typescript
// src/server/services/notification-idempotency.ts
function generateIdempotencyKey(event: Event, channel: string): string {
  const parts = [
    event.eventType,        // "appointment.created"
    event.aggregateId,      // UUID appointment
    event.payload.userId,   // получатель
    channel,                // "telegram"
  ];
  return parts.join('.');
}
```

---

## 7. Retry System

### 7.1 Общая политика

| Параметр | Значение |
|----------|----------|
| **Max attempts** | 5 (для очередей доставки); 3 (для notification queue) |
| **Backoff strategy** | Exponential: `baseDelay * 2^(attempt - 1) + jitter` |
| **Jitter** | ±20% (чтобы не было Thundering Herd при перезапуске) |
| **Non-retriable errors** | `invalid_recipient`, `invalid_template`, `spam`, `unsubscribe` |
| **Max age in queue** | 7 дней (дольше — только перезапуск вручную) |

### 7.2 Non-retriable ошибки

При таких ошибках job сразу перемещается в DLQ без retry:

```typescript
const NON_RETRIABLE_ERRORS = [
  'invalid_recipient',  // невалидный email/телефон/chatId
  'invalid_template',   // ошибка рендеринга шаблона
  'unsubscribe',        // пользователь отписался
  'spam',               // провайдер пометил как спам
  'invalid_subscription', // истекла push-подписка
  'bounced',            // email bounced (несуществующий ящик)
  'blocked_by_user',    // пользователь заблокировал бота
];
```

### 7.3 Пример конфигурации BullMQ

```typescript
// src/server/queue/queues/email.queue.ts
export const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 30000, // 30s base
    },
    // Jitter добавляется на уровне worker через delay
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 200 },
  },
});
```

### 7.4 Dead Letter Queue обработчик

```typescript
// src/server/queue/dlq/dlq-handler.ts

// При падении job в DLQ:
// 1. Сохраняем причину в NotificationAttempt
// 2. Шлём алерт администратору
// 3. Job доступна для manual retry через API

// Manual retry:
// POST /api/trpc/admin.retryNotification
// → Достаёт job из DLQ → добавляет в основную очередь с новым attemptNumber
```

---

## 8. Templates

### 8.1 Переменные шаблонов

Шаблоны используют `{{variable}}` синтаксис (Handlebars-like, но кастомный рендерер).

#### Доступные переменные (глобальные)

| Переменная | Описание | Пример |
|------------|----------|--------|
| `{{appointmentId}}` | UUID записи | |
| `{{clientName}}` | Имя клиента | "Алексей" |
| `{{clientPhone}}` | Телефон клиента | "+7 (999) 123-45-67" |
| `{{barberName}}` | Имя барбера | "Михаил" |
| `{{serviceName}}` | Название услуги | "Мужская стрижка" |
| `{{date}}` | Дата (локализованная) | "15 марта 2026" |
| `{{time}}` | Время | "14:30" |
| `{{duration}}` | Длительность | "60 мин" |
| `{{price}}` | Цена | "1 500 ₽" |
| `{{branchName}}` | Название филиала | "Барбершоп на Тверской" |
| `{{branchAddress}}` | Адрес филиала | "ул. Тверская, 10" |
| `{{rating}}` | Оценка (для отзывов) | "5" |
| `{{cancelReason}}` | Причина отмены | "Не могу прийти" |
| `{{barbershopName}}` | Название барбершопа (из настроек) | "BarberPro" |

#### Pipeline-переменные (цепочки)

```
{{#if clientName}}{{clientName}}{{else}}Клиент{{/if}}
{{#formatDate date "DD MMMM"}}
{{#truncate text 100}}
```

### 8.2 Локализация

```prisma
// Поле locale = "ru" | "en" в NotificationTemplate

// При отправке:
// 1. Определяем язык пользователя (User.locale или fallback "ru")
// 2. Ищем шаблон: NotificationTemplate.find({ type, channel, locale, isActive: true })
// 3. Если шаблон не найден → fallback на "ru"
// 4. Если "ru" тоже нет → fallback на body из кода
```

Пример шаблонов:

| Type | Channel | ru | en |
|------|---------|----|----|
| AppointmentCreated | telegram | `✓ Запись на {date} в {time}` | `✓ Appointment on {date} at {time}` |
| AppointmentReminder | email | `Напоминание о записи {date}` | `Appointment reminder {date}` |

### 8.3 Версионирование

```typescript
// Каждый шаблон имеет version (int)
// При изменении шаблона — создаётся новая запись с version+1
// Старая версия остаётся для отправленных уведомлений (audit)

// Стратегия:
// - isActive = true у последней версии
// - Старые версии: isActive = false, но сохраняются для истории
// - Notification хранит templateVersion на момент отправки
```

### 8.4 Система рендеринга

```typescript
// src/server/services/template-renderer.ts

interface TemplateContext {
  user: { locale: string; name: string; ... };
  notificationType: NotificationType;
  channel: string;
  data: Record<string, unknown>; // payload from Event
}

// 1. Load template: findBestTemplate(type, channel, locale)
// 2. Render: replace {{variable}} from context
// 3. Conditional blocks: {{#if var}}...{{/if}}
// 4. Return { subject?, title?, body }
```

---

## 9. Security

### 9.1 Rate Limits

| Уровень | Лимит | Санкция |
|---------|-------|---------|
| **Пользователь** | 50 notifications/hour | Остальные — в DLQ |
| **Канал (Telegram)** | 30 msg/s | Backoff + queue |
| **Канал (Email)** | 10 emails/min per user | Queue delay |
| **Канал (SMS)** | 5 SMS/day per user | Блокировка до следующего дня |
| **Глобальный (Email)** | 1000 emails/hour | Alert администратору |

### 9.2 Privacy

1. **GDPR/152-ФЗ:**
   - Хранить `UserChannel` с согласием пользователя (`isVerified`)
   - Возможность отписаться: `unsubscribe` token в каждом email/SMS
   - `NotificationAttempt.responsePayload` не содержит PII/P secrets

2. **Content safety:**
   - Шаблоны не содержат raw SQL/JS — только `{{variable}}`
   - Пользовательский контент (отзывы) экранируется при вставке в шаблон
   - `body` в Notification хранит уже отрендеренный текст (snapshot)

3. **Data retention:**
   - NotificationAttempt: 90 дней
   - Event (outbox): 30 дней после COMPLETED
   - Notification: 1 год

### 9.3 Token Storage

```typescript
// Никогда не храним tokens в plaintext в NotificationAttempt

interface PushSubscription {
  endpoint: string;         // URL — хранится
  keys: {
    p256dh: string;         // public key — хранится
    auth: string;           // auth secret — хранится (зашифровано)
  };
}

// Telegram bot token → только в env: TELEGRAM_BOT_TOKEN
// SendGrid API key → только в env: SENDGRID_API_KEY
// VAPID keys → только в env
```

### 9.4 Webhook Security

```typescript
// Для вебхуков от SendGrid/Telegram:
// 1. Signature verification: проверять подпись каждого вебхука
// 2. IP whitelist: принимать запросы только от IP провайдера
// 3. Secret rotation: менять секреты каждые 90 дней
// 4. Payload validation: zod-схема для каждого типа вебхука
```

---

## 10. Monitoring

### 10.1 Metrics

| Метрика | Тип | Источник |
|---------|-----|----------|
| `notifications.created.total` | Counter | Notification creation |
| `notifications.sent.{channel}` | Counter | Worker: sent |
| `notifications.delivered.{channel}` | Counter | Worker: delivery confirmed |
| `notifications.failed.{channel}` | Counter | Worker: failure |
| `notifications.dlq.{queue}` | Gauge | DLQ count |
| `notifications.retry_attempts` | Histogram | Per job |
| `notifications.latency.{channel}` | Histogram | Created → delivered |
| `queue.{name}.waiting` | Gauge | BullMQ status |
| `queue.{name}.active` | Gauge | BullMQ status |
| `queue.{name}.delayed` | Gauge | BullMQ status |
| `queue.{name}.failed` | Gauge | BullMQ status |

### 10.2 Логирование

```typescript
// Каждый шаг логируется структурно (winston):
// { eventId, notificationId, channel, attempt, status, latency, error? }

// Уровни:
// INFO  — создано, отправлено, доставлено
// WARN  — retry, rate limit, временная ошибка
// ERROR — DLQ, non-retriable error, падение worker

// Audit: каждый вызов внешнего API логируется (без secrets)
```

### 10.3 Мониторинг failed-уведомлений

```typescript
// Dashboard: /admin/notifications/failed
// - Фильтры: канал, тип, дата, ошибка
// - Таблица: user, type, channel, attempt, error, createdAt
// - Action: Retry, View payload, View attempt

// Alert:
// - >10% failed rate за последний час → Telegram/Slack администратору
// - Любой job в DLQ → Telegram администратору
// - Email bounce rate >5% → уведомление
```

### 10.4 Health Checks

```typescript
// GET /api/health/notifications
// 1. Redis connection (ping)
// 2. BullMQ queue status (waiting + active + delayed + failed counts)
// 3. Database connectivity (SELECT 1)
// 4. Last successful delivery timestamp
// 5. DLQ count per queue
```

---

## 11. Структура файлов

```
src/
├── server/
│   ├── queue/
│   │   ├── connection.ts
│   │   ├── index.ts
│   │   ├── queues/
│   │   │   ├── notification.queue.ts
│   │   │   ├── email.queue.ts
│   │   │   ├── telegram.queue.ts
│   │   │   └── push.queue.ts
│   │   ├── workers/
│   │   │   ├── notification.worker.ts
│   │   │   ├── email.worker.ts
│   │   │   ├── telegram.worker.ts
│   │   │   └── push.worker.ts
│   │   └── dlq/
│   │       └── dlq-handler.ts
│   ├── services/
│   │   ├── notification.ts          # Notification Service
│   │   ├── notification-idempotency.ts
│   │   ├── template-renderer.ts
│   │   ├── outbox-poller.ts         # Polls Event outbox → notification queue
│   │   └── channels/
│   │       ├── telegram.ts
│   │       ├── email.ts
│   │       ├── push.ts
│   │       └── sms.ts               (future)
│   ├── repositories/
│   │   ├── notification.ts
│   │   ├── notification-template.ts
│   │   ├── notification-preference.ts
│   │   ├── notification-attempt.ts
│   │   └── user-channel.ts
│   └── lib/
│       └── notification-validators.ts  # Zod-схемы для вебхуков
│
├── trpc/
│   └── routers/
│       ├── notification.ts          # API для in-app уведомлений
│       ├── notification-admin.ts    # Admin API: retry, stats, settings
│       └── webhooks/
│           ├── telegram.ts          # Telegram bot webhook
│           ├── email.ts             # SendGrid event webhook
│           └── push.ts              # Push service webhook
│
├── app/
│   ├── api/
│   │   ├── webhooks/
│   │   │   ├── telegram/route.ts
│   │   │   ├── email/route.ts
│   │   │   └── push/route.ts
│   │   └── health/notifications/route.ts
│   └── admin/
│       └── notifications/
│           ├── page.tsx             # Admin notification dashboard
│           └── failed/page.tsx      # DLQ browser + manual retry
│
└── components/
    └── notifications/
        ├── notification-bell.tsx     # In-app notification bell
        ├── notification-list.tsx     # In-app notification list
        └── notification-toast.tsx    # Real-time toast (WebSocket/SSE)
```

---

## 12. Аудит архитектуры

### 12.1 Масштабируемость

| Аспект | Оценка | Комментарий |
|--------|--------|-------------|
| **RPS** | ✅ 1000+ событий/мин | Outbox пишет в БД (быстро); BullMQ с Redis выдерживает 10k+ jobs/sec |
| **Горизонтальное масштабирование** | ✅ | Workers stateless: можно запустить N экземпляров. Redis cluster для больших инсталляций |
| **PostgreSQL нагрузка** | ⚠️ Outbox poll — нагрузка на `WHERE status = 'PENDING'` | Нужен индекс `[status, createdAt]` (существует). При 1M+ rows — добавить pagination |
| **Каналы** | ⚠️ Telegram — 30 msg/s | Можно распределить по нескольким ботам (на каждый филиал — свой бот) |
| **BullMQ** | ✅ | Native clustering, rate limiter, sandbox workers |

### 12.2 Надёжность

| Аспект | Оценка | Комментарий |
|--------|--------|-------------|
| **At-least-once** | ✅ | Outbox гарантирует, что событие не потеряется |
| **At-most-once per channel** | ✅ | IdempotencyKey + dedup |
| **Redis failover** | ⚠️ При падении Redis — очередь недоступна | Но события в БД не теряются. После восстановления — outbox poll доставит |
| **DB failover** | ✅ | Транзакционная запись в outbox гарантирует целостность |
| **Worker crash mid-send** | ✅ | Retry + idempotency |
| **Provider outage (SendGrid, Telegram)** | ✅ | Exponential backoff + queue |
| **Data loss** | ✅ | NotificationAttempt — полный аудит |

### 12.3 Стоимость эксплуатации

| Ресурс | Стоимость | Примечание |
|--------|-----------|------------|
| **Redis** | $15-50/мес (Upstash / Memorystore) | Только для очереди; можно shared с кэшем (разные DB) |
| **SendGrid** | $19.95/мес (50k emails) | Бесплатно до 100 emails/day (для старта) |
| **Telegram Bot API** | Бесплатно | Ограничение 30 msg/s |
| **Web Push** | Бесплатно | Только VAPID keys |
| **SMS** | $0.05-0.10/сообщение | Только для критических уведомлений |
| **PostgreSQL** | Часть основной БД | Outbox + Notification — ~10% дополнительной нагрузки |

### 12.4 Production readiness

| Критерий | Статус | Что нужно |
|----------|--------|-----------|
| **Dependencies** | ❌ | BullMQ, Redis, SendGrid SDK, Telegram Bot SDK — не установлены |
| **Migrations** | ❌ | NotificationTemplate, NotificationPreference, UserChannel, NotificationAttempt — не созданы |
| **Outbox worker** | ❌ | Cron/poll не реализован (пока `Event` в БД не обрабатывается) |
| **Idempotency** | ❌ | Поле `idempotencyKey` в Notification не добавлено |
| **Telegram bot** | ❌ | Нет бота, нет команды `/start` |
| **Web Push** | ❌ | Нет Service Worker, нет VAPID keys |
| **Health checks** | ❌ | Нет endpoint |
| **Metrics** | ❌ | Нет экспорта метрик |
| **Templates** | ❌ | Нет шаблонов, нет админки |
| **Admin UI** | ❌ | Нет дашборда failed-уведомлений |
| **Rate limiter** | ❌ | Не реализован |

### 12.5 Рекомендации по внедрению (phases)

#### Phase 1 — Foundation (1-2 недели)
1. Установить зависимости: `bullmq`, `ioredis`, `@sendgrid/mail`, `telegraf` (для Telegram)
2. Создать Prisma миграции: `NotificationTemplate`, `NotificationPreference`, `UserChannel`, `NotificationAttempt`
3. Добавить `idempotencyKey` в модель `Notification`
4. Создать BullMQ очереди (`src/server/queue/`)
5. Реализовать Outbox Poller (cron: каждые 5 секунд)
6. Добавить health check endpoint

#### Phase 2 — Core Channels (1 неделя)
1. Реализовать Telegram worker + webhook `/start`
2. Реализовать Email worker (SendGrid)
3. Создать базовые шаблоны (AppointmentCreated, AppointmentReminder)
4. Добавить NotificationPreference UI в настройки пользователя

#### Phase 3 — Polish (1 неделя)
1. Реализовать Web Push (Service Worker)
2. Notification In-App (bell + list)
3. Admin failed-notification dashboard
4. Rate limiter

#### Phase 4 — Hardening (постоянно)
1. Мониторинг + алерты
2. A/B тестирование шаблонов
3. SMS-канал
4. WebSocket для real-time in-app уведомлений

---

## Приложение A: Пример Notification Service (псевдокод)

```typescript
// src/server/services/notification.ts

class NotificationService {
  async processEvent(event: Event): Promise<void> {
    // 1. Определить получателей и каналы из event.type
    const recipients = this.determineRecipients(event);
    
    for (const recipient of recipients) {
      // 2. Получить настройки пользователя
      const prefs = await this.getPreferences(recipient.userId, event.eventType);
      
      for (const channel of prefs.enabledChannels) {
        // 3. Проверить quiet hours
        if (this.isQuietHour(channel, prefs)) continue;
        
        // 4. Проверить idempotency
        const idempotencyKey = generateIdempotencyKey(event, channel);
        const exists = await notificationRepo.exists(idempotencyKey);
        if (exists) continue;
        
        // 5. Получить шаблон + отрендерить
        const template = await templateRenderer.render({
          type: event.eventType,
          channel,
          locale: recipient.locale,
          data: event.payload,
        });
        
        // 6. Создать Notification (в БД)
        const notification = await notificationRepo.create({
          userId: recipient.userId,
          type: event.eventType,
          channel,
          idempotencyKey,
          ...template,
        });
        
        // 7. Добавить job в очередь канала
        await this.enqueue(channel, {
          notificationId: notification.id,
          channelData: recipient.channelData,
          template,
        });
      }
    }
  }
}
```

## Приложение B: .env переменные

```
# Redis (для BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_WEBHOOK_URL=https://api.barberpro.ru/api/webhooks/telegram

# Email
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@barberpro.ru
SENDGRID_FROM_NAME=BarberPro

# Web Push
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@barberpro.ru

# SMS (будущее)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Отладка
NOTIFICATION_DRY_RUN=false  # true = не отправлять реально, только логировать
```
