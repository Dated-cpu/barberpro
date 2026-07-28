# Booking Engine — BarberPro

## Architecture

### Layer flow

```
tRPC Router → Service → Repository → Prisma → PostgreSQL
     ↓
  Validator (Zod)
     ↓
  Outbox Event
```

### Module structure

```
src/
  server/
    repositories/
      appointment.ts    — CRUD + overlap queries
      workingDay.ts     — working day templates + overrides
      blockedSlot.ts    — time blocks (vacation, sick)
      service.ts        — service lookup
    services/
      availability.ts   — slot generation algorithm
      appointment.ts    — appointment lifecycle
    lib/
      date.ts           — timezone helpers (date-fns-tz)
  validators/
    booking.ts          — Zod schemas for booking
  types/
    booking.ts          — AvailableSlot, DateSlots types
  trpc/routers/
    availability.ts     — getAvailableSlots, getBarberSchedule
    appointment.ts      — create, confirm, cancel, complete, markNoShow
```

---

## Slot Generation Algorithm

### Input
- `barberId: string` — UUID барбера
- `date: string` — "YYYY-MM-DD"
- `serviceId: string` — UUID услуги (для длительности)

### Output
- `AvailableSlot[]` — массив свободных слотов

### Steps

```
1. Получить услугу (service.duration в минутах)
2. Получить барбера с его филиалом (для timezone)
3. Определить рабочий день:
   a. Ищем WorkingDay с date = запрошенная дата (override)
   b. Если нет — ищем WorkingDay с dayOfWeek = день недели (template)
   c. Если ничего нет или isDayOff → пустой массив
4. Получить все Appointment на эту дату (status != CANCELLED, NO_SHOW)
5. Получить все BlockedSlot на эту дату
6. Генерация слотов:
   for current = startTime; current + duration <= endTime; current += duration:
     - Проверить пересечение с обедом (breakStart/breakEnd)
     - Проверить пересечение с существующими Appointment
     - Проверить пересечение с BlockedSlot
     - Если все проверки пройдены → добавить в результат
7. Вернуть массив AvailableSlot[]
```

### Overlap detection

Два временных интервала [A_start, A_end) и [B_start, B_end) пересекаются, если:

```
A_start < B_end AND A_end > B_start
```

Граничный случай: `[10:00, 11:00)` и `[11:00, 12:00)` **не** пересекаются (допустимо).

### Timezone handling

- WorkingDay хранит время как "HH:mm" в часовом поясе филиала
- Branch.timezone определяет часовой пояс (например, "Europe/Moscow")
- `date-fns-tz` конвертирует локальное время в UTC для хранения в Appointment
- Все `DateTime` в БД хранятся как UTC (timestamptz)

---

## Appointment Lifecycle

```
                ┌─────────┐
                │ PENDING │ ← создан клиентом
                └────┬────┘
                     │
              ┌──────┴──────┐
              ▼             ▼
        ┌──────────┐  ┌──────────┐
        │CONFIRMED │  │CANCELLED │ ← клиент/барбер до подтверждения
        └─────┬────┘  └──────────┘
              │
        ┌─────┴─────┐
        ▼           ▼
  ┌──────────┐  ┌──────────┐
  │IN_PROGRESS│  │ NO_SHOW  │ ← клиент не пришёл
  └─────┬────┘  └──────────┘
        ▼
  ┌──────────┐
  │COMPLETED │
  └──────────┘
```

### State transitions

| From | To | Trigger | Auth |
|------|----|---------|------|
| PENDING | CONFIRMED | barber confirms | BARBER/ADMIN |
| PENDING | CANCELLED | client or barber cancels | CLIENT* / BARBER / ADMIN |
| CONFIRMED | IN_PROGRESS | barber starts | BARBER/ADMIN |
| CONFIRMED | CANCELLED | client or barber cancels | CLIENT* / BARBER / ADMIN |
| CONFIRMED | NO_SHOW | barber marks no-show | BARBER/ADMIN |
| IN_PROGRESS | COMPLETED | barber finishes | BARBER/ADMIN |

\* CLIENT может отменить только свою запись.

---

## Concurrency Protection

### Strategy: Serializable Transactions + Application-Level Check

При создании записи (`createAppointment`):

```
1. Начать транзакцию с isolation level = Serializable
2. Проверить пересекающиеся Appointment (COUNT)
3. Проверить пересекающиеся BlockedSlot
4. Если конфликтов нет → создать Appointment
5. Если serialization error → retry (максимум 3 попытки)
6. Записать Event в Outbox (в той же транзакции)
```

### Почему Serializable?

- READ COMMITTED допускает phantom reads (новые строки, добавленные параллельной транзакцией)
- Serializable гарантирует, что параллельные транзакции не создадут конфликтующих записей
- PostgreSQL использует оптимистичный Serializable (SSI) — блокировка только при реальном конфликте

### Database constraints

- `Appointment` имеет составной индекс `[barberId, startTime, endTime]`
- Нет уникального constraints на `(barberId, startTime)` — два слота могут частично пересекаться
- Защита на уровне приложения (всегда в транзакции)

---

## Transaction Flow (createAppointment)

```
Client → tRPC → AppointmentService.create()
                    │
                    ▼
              prisma.$transaction({ isolationLevel: 'Serializable' })
                    │
                    ├── serviceRepository.findById()
                    ├── userRepository (barber check)
                    ├── appointmentRepository.findOverlappingCount()
                    ├── blockedSlotRepository.findByBarberAndTimeRange()
                    ├── appointmentRepository.create()
                    ├── dispatchEvent (APPOINTMENT_CREATED → events table)
                    └── commit
                    │
                    ▼
              return Appointment
```

---

## Edge Cases

### 1. Часовые пояса
- **Проблема:** филиал в Москве, клиент во Владивостоке
- **Решение:** все слоты генерируются в часовом поясе филиала
- Клиент видит время филиала (фронтенд может конвертировать в локальное)

### 2. Переход через полночь
- Текущая реализация не поддерживает слоты, переходящие через полночь
- Барбер должен создать два WorkingDay или использовать BlockedSlot

### 3. Шаблон vs Переопределение
- Приоритет: date override > dayOfWeek template
- Если есть override с isDayOff = true → барбер не работает (template игнорируется)

### 4. Обеденный перерыв
- Слот не может начинаться до обеда и заканчиваться после
- Алгоритм пропускает обеданный диапазон

### 5. Разные длительности услуг
- Одна услуга на 30 мин, другая на 120 мин
- Каждый запрос на слоты считает с учётом длительности конкретной услуги
- Короткие услуги могут помещаться между длинными

### 6. Множественные блокировки
- Барбер может иметь несколько BlockedSlot в один день
- Отпуск: один большой BlockedSlot на весь день

### 7. Отмена записи
- Отменённая запись освобождает слот
- Статус CANCELLED не участвует в проверке пересечений

### 8. Race condition
- Два клиента одновременно бронируют последний слот
- Serializable isolation: одна транзакция пройдёт, вторая получит ошибку

---

## API Endpoints

### Availability

| Procedure | Type | Auth | Input | Output |
|-----------|------|------|-------|--------|
| `availability.getAvailableSlots` | query | public | barberId, date, serviceId | AvailableSlot[] |
| `availability.getBarberSchedule` | query | BARBER | barberId, startDate, endDate | Appointment[] |

### Appointment

| Procedure | Type | Auth | Input | Output |
|-----------|------|------|-------|--------|
| `appointment.create` | mutation | public* | createAppointmentSchema | Appointment |
| `appointment.confirm` | mutation | BARBER | appointmentId | Appointment |
| `appointment.cancel` | mutation | CLIENT+ | appointmentId, reason? | Appointment |
| `appointment.complete` | mutation | BARBER | appointmentId, notes? | Appointment |
| `appointment.markNoShow` | mutation | BARBER | appointmentId | Appointment |
| `appointment.getById` | query | CLIENT+ | id | Appointment |
| `appointment.getMyAppointments` | query | CLIENT+ | — | Appointment[] |

\* create доступен без авторизации (гостям), clientId = "guest" для незарегистрированных.

---

## Testing

### Unit tests (tests/booking.test.ts)

| Test | Description |
|------|-------------|
| timeToMinutes / minutesToTime | Round-trip conversion |
| addMinutesToTime | Time arithmetic |
| isTimeInRange | Range boundary check |
| Overlap detection | Slot collision logic |
| Break time exclusion | Slots skip lunch |
| Full day slot generation | Count slots for 9h day |
| Occupied slot skipping | Existing appointments block slots |
| Different durations | 30/60/90/120 min services |
| Double booking prevention | Exact match blocked |
| Adjacent booking allowed | Back-to-back slots OK |

### Test results
- **Test files:** 4 (auth, validators, permissions, booking)
- **Tests:** 25 passing
- **TypeScript:** 0 errors
- **ESLint:** 0 warnings
- **Build:** clean
