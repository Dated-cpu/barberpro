# BarberPro — Архитектура системы онлайн-записи для барбера

---

## 1. Стек технологий

### Frontend
| Технология | Назначение |
|---|---|
| **Next.js 15** (App Router) | React-фреймворк, SSR/SSG/RSC, файловый роутинг |
| **TypeScript** (strict mode) | Типизация на всём фронте |
| **Tailwind CSS v4** | Utility-first CSS, дизайн-система через токены |
| **Framer Motion** | Анимации, микроинтеракции, layout transitions |
| **React Three Fiber** | WebGL сцена на главном экране |
| **@react-three/drei** | Хелперы для R3F (OrbitControls, Environment) |
| **React Query / TanStack Query** | Серверное состояние, кэширование, optimistic updates |
| **Zustand** | Клиентское состояние (UI state, модалки) |
| **React Hook Form + Zod** | Формы и валидация |
| **next-intl** | Интернационализация (RU/EN) |
| **React Aria Components** | Accessibility-first компоненты |

### Backend
| Технология | Назначение |
|---|---|
| **Next.js API Routes** (Route Handlers) | API-слой, встроен в Next.js |
| **tRPC** | End-to-end typesafe API (альтернатива REST) |
| **Zod** | Валидация входных данных (shared с фронтом) |
| **PostgreSQL** | Основная БД |
| **Prisma** | ORM, миграции, типобезопасные запросы |
| **NextAuth.js / Auth.js v5** | Аутентификация (credentials + OAuth) |
| **BullMQ** | Очереди задач (напоминания, очистка токенов) |
| **ioredis** | Redis клиент (кэш, очереди, сессии) |

### Database
| Технология | Назначение |
|---|---|
| **PostgreSQL 16** | Реляционная БД |
| **Redis 7** | Кэш, сессии, очередь задач |
| **MinIO / AWS S3** | Хранилище изображений (галерея, аватар) |

### Deployment
| Технология | Назначение |
|---|---|
| **Docker** | Контейнеризация |
| **Docker Compose** | Локальная разработка |
| **Vercel** | Хостинг Next.js (frontend + API) |
| **Railway / Fly.io** | Хостинг PostgreSQL + Redis |
| **Cloudflare R2** | S3-совместимое хранилище изображений |

### Testing
| Технология | Назначение |
|---|---|
| **Vitest** | Unit-тесты |
| **React Testing Library** | Component-тесты |
| **Playwright** | E2E-тесты |
| **MSW** (Mock Service Worker) | Моки API в тестах |
| **Storybook** | Визуальное тестирование компонентов |

### CI/CD
| Инструмент | Назначение |
|---|---|
| **GitHub Actions** | CI/CD пайплайн |
| **Husky + lint-staged** | Pre-commit хуки |
| **GitHub Container Registry** | Хранилище Docker-образов |
| **Sentry** | Мониторинг ошибок |

---

## 2. Структура проекта

```
barberpro/
├── apps/
│   └── web/                          # Next.js приложение
│       ├── public/
│       │   ├── images/               # Статические изображения
│       │   ├── fonts/                # Локальные шрифты
│       │   └── models/               # 3D модели для WebGL сцены
│       ├── src/
│       │   ├── app/                  # Next.js App Router (страницы)
│       │   │   ├── (public)/         # Публичные страницы
│       │   │   │   ├── page.tsx      # Главная (с WebGL сценой)
│       │   │   │   ├── services/     # Услуги
│       │   │   │   ├── gallery/      # Галерея работ
│       │   │   │   ├── pricing/      # Цены
│       │   │   │   ├── contacts/     # Контакты
│       │   │   │   ├── booking/      # Онлайн-запись
│       │   │   │   └── reviews/      # Отзывы
│       │   │   ├── (auth)/           # Страницы аутентификации
│       │   │   │   ├── login/
│       │   │   │   ├── register/
│       │   │   │   └── reset-password/
│       │   │   ├── (dashboard)/      # Личный кабинет клиента
│       │   │   │   ├── appointments/
│       │   │   │   ├── history/
│       │   │   │   └── profile/
│       │   │   └── (admin)/          # Админ-панель
│       │   │       ├── dashboard/
│       │   │       ├── schedule/
│       │   │       ├── clients/
│       │   │       ├── services/
│       │   │       ├── gallery/
│       │   │       ├── settings/
│       │   │       └── analytics/
│       │   ├── app/                  # Route Handlers (API)
│       │   │   └── api/
│       │   │       ├── auth/
│       │   │       ├── appointments/
│       │   │       ├── services/
│       │   │       ├── gallery/
│       │   │       ├── reviews/
│       │   │       ├── working-hours/
│       │   │       ├── blocked-slots/
│       │   │       └── upload/
│       │   ├── components/           # Компоненты (Feature-Sliced + Atomic)
│       │   │   ├── ui/               # Атомарные UI-компоненты (Button, Input)
│       │   │   ├── shared/           # Переиспользуемые блоки (Header, Footer)
│       │   │   ├── features/         # Feature-компоненты
│       │   │   │   ├── booking-widget/
│       │   │   │   ├── schedule-calendar/
│       │   │   │   ├── gallery-grid/
│       │   │   │   └── review-card/
│       │   │   ├── webgl/            # WebGL компоненты сцены
│       │   │   │   ├── Scene.tsx
│       │   │   │   ├── BarberTools.tsx
│       │   │   │   ├── SmokeParticles.tsx
│       │   │   │   ├── WarmLight.tsx
│       │   │   │   └── CameraController.tsx
│       │   │   └── layouts/          # Layout-компоненты
│       │   ├── lib/                  # Утилиты, хелперы
│       │   │   ├── utils/
│       │   │   ├── validators/       # Zod схемы (shared)
│       │   │   ├── constants/
│       │   │   └── helpers/
│       │   ├── hooks/                # React hooks
│       │   ├── stores/               # Zustand stores
│       │   ├── server/               # Server-only код
│       │   │   ├── db/               # Prisma client
│       │   │   ├── services/         # Бизнес-логика
│       │   │   ├── queue/            # BullMQ задачи
│       │   │   └── emails/           # Email-шаблоны
│       │   ├── trpc/                 # tRPC router + context
│       │   ├── styles/               # Глобальные стили
│       │   └── types/                # TypeScript типы
│       ├── prisma/
│       │   ├── schema.prisma         # Модели БД
│       │   ├── migrations/
│       │   └── seed.ts               # Сиды
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       ├── stories/                  # Storybook
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   └── shared/                       # Shared types, validators, constants
│       ├── src/
│       │   ├── validators/
│       │   ├── types/
│       │   └── constants/
│       └── package.json
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── .husky/
├── ARCHITECTURE.md
└── README.md
```

### Назначение папок

| Папка | Назначение |
|---|---|
| `apps/web/src/app/(public)` | Публичные страницы (главная, услуги, галерея) — доступны без авторизации |
| `apps/web/src/app/(auth)` | Страницы входа/регистрации |
| `apps/web/src/app/(dashboard)` | Личный кабинет клиента (мои записи, история, профиль) |
| `apps/web/src/app/(admin)` | Админ-панель (расписание, клиенты, услуги, аналитика) |
| `apps/web/src/app/api` | Next.js Route Handlers — REST API endpoints |
| `apps/web/src/components/ui` | Atomic Design: атомы (Button, Input, Badge, Modal) |
| `apps/web/src/components/features` | Feature-Sliced: самодостаточные бизнес-фичи |
| `apps/web/src/components/webgl` | Компоненты Three.js сцены |
| `apps/web/src/server/services` | Бизнес-логика (серверный слой, изолирован от API) |
| `apps/web/src/server/db` | Prisma client singleton |
| `apps/web/src/server/queue` | BullMQ workers (email reminders, cleanups) |
| `apps/web/src/hooks` | React hooks (useMediaQuery, useDebounce, useConfirmation) |
| `apps/web/src/stores` | Zustand stores (booking flow, UI state) |
| `packages/shared` | Общие типы и валидаторы между frontend и backend |

---

## 3. База данных

### Сущности и связи

```
┌─────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      User       │       │     Service      │       │   Appointment    │
├─────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (UUID)       │       │ id (UUID)        │       │ id (UUID)        │
│ email (uniq)    │       │ name             │       │ clientId (FK)    │
│ phone (uniq)    │       │ description      │       │ serviceId (FK)   │
│ password (hash) │       │ duration (min)   │       │ barberId (FK)    │
│ name            │       │ price (decimal)  │       │ startTime        │
│ role (enum)     │──┐    │ category         │       │ endTime          │
│ avatar          │  │    │ isActive         │       │ status (enum)    │
│ createdAt       │  │    │ image            │       │ notes            │
│ updatedAt       │  │    │ sortOrder        │       │ createdAt        │
└─────────────────┘  │    └──────────────────┘       │ updatedAt        │
                      │                              └──────────────────┘
                      │                                       │
                      │    ┌──────────────────┐               │
                      │    │  WorkingHours    │               │
                      │    ├──────────────────┤               │
                      └────│ barberId (FK)    │               │
                           │ dayOfWeek (1-7)  │               │
                           │ startTime        │               │
                           │ endTime          │               │
                           │ isActive         │               │
                           └──────────────────┘               │
                                                              │
                      ┌──────────────────┐                    │
                      │  BlockedSlot     │                    │
                      ├──────────────────┤                    │
                      │ barberId (FK)    │                    │
                      │ startTime        │                    │
                      │ endTime          │                    │
                      │ reason           │                    │
                      └──────────────────┘                    │
                                                              │
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│    Gallery      │  │     Review       │  │   Portfolio      │
├─────────────────┤  ├──────────────────┤  ├──────────────────┤
│ id (UUID)       │  │ id (UUID)        │  │ id (UUID)        │
│ url             │  │ clientId (FK)    │  │ barberId (FK)    │
│ alt             │  │ rating (1-5)     │  │ title            │
│ category        │  │ text             │  │ image            │
│ sortOrder       │  │ isVisible        │  │ description      │
│ createdAt       │  │ createdAt        │  │ createdAt        │
└─────────────────┘  └──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐
│  RefreshToken    │  │    Session       │
├──────────────────┤  ├──────────────────┤
│ id (UUID)        │  │ id (UUID)        │
│ userId (FK)      │  │ userId (FK)      │
│ token (hash)     │  │ device           │
│ expiresAt        │  │ ip               │
│ createdAt        │  │ userAgent        │
└──────────────────┘  │ expiresAt        │
                      │ createdAt        │
                      └──────────────────┘

┌──────────────────┐  ┌──────────────────┐
│   BarberSettings │  │  Notification    │
├──────────────────┤  ├──────────────────┤
│ barberId (FK)    │  │ id (UUID)        │
│ timezone         │  │ userId (FK)      │
│ bufferTime (min) │  │ type (enum)      │
│ maxClientsPerDay │  │ title            │
│ workingDays      │  │ body             │
│ lunchStart       │  │ isRead           │
│ lunchEnd         │  │ createdAt        │
└──────────────────┘  └──────────────────┘
```

### Описание сущностей

**User** — Пользователь системы. Роли: `guest`, `client`, `barber`, `admin`.

**Service** — Услуга (стрижка, укладка, борода). Принадлежит барберу (или общие).

**Appointment** — Запись клиента на услугу. Статус: `pending`, `confirmed`, `completed`, `cancelled`.

**WorkingHours** — Расписание барбера по дням недели (шаблон).

**BlockedSlot** — Разовое исключение из расписания (отпуск, болезнь).

**Gallery** — Изображения для публичной галереи.

**Review** — Отзыв клиента после выполненной записи.

**Portfolio** — Работы барбера (до/после).

**RefreshToken** — Токены для обновления JWT.

**Session** — Сессии пользователя (устройства).

**BarberSettings** — Настройки барбера (таймзона, буфер, обед).

**Notification** — Уведомления пользователя (напоминание о записи, отмена).

---

## 4. REST API (tRPC)

### Эндпоинты

#### Аутентификация
```
POST   /api/auth/register          — Регистрация клиента
POST   /api/auth/login             — Вход (email + password)
POST   /api/auth/logout            — Выход
POST   /api/auth/refresh           — Обновление access token
POST   /api/auth/reset-password    — Сброс пароля (email)
PATCH  /api/auth/change-password   — Смена пароля (авторизован)
```

#### Пользователи
```
GET    /api/users/me               — Профиль текущего пользователя
PATCH  /api/users/me               — Обновление профиля
GET    /api/users/:id              — Публичный профиль барбера
```

#### Услуги
```
GET    /api/services               — Список услуг (фильтр: category, barberId)
GET    /api/services/:id           — Детальная информация
POST   /api/services               — Создать услугу (admin)
PATCH  /api/services/:id           — Обновить услугу (admin)
DELETE /api/services/:id           — Удалить услугу (admin)
```

#### Записи
```
GET    /api/appointments           — Список записей (фильтр: date, status, barberId)
GET    /api/appointments/:id       — Детали записи
POST   /api/appointments           — Создать запись
PATCH  /api/appointments/:id       — Обновить статус (confirm/cancel)
DELETE /api/appointments/:id       — Отменить запись (client или barber)

Пример создания записи:
POST /api/appointments
{
  "serviceId": "uuid",
  "date": "2026-08-15",
  "time": "10:00",
  "notes": "Хочу модельную стрижку"
}
Response: {
  "id": "uuid",
  "startTime": "2026-08-15T10:00:00Z",
  "endTime": "2026-08-15T11:00:00Z",
  "status": "pending",
  "service": { "name": "Мужская стрижка", "price": 1500 },
  "barber": { "name": "Алексей" }
}
```

#### Рабочее время
```
GET    /api/working-hours          — Расписание барбера (текущая неделя)
POST   /api/working-hours          — Установить шаблон расписания
PATCH  /api/working-hours/:id      — Изменить день
DELETE /api/working-hours/:id      — Удалить день из расписания
```

#### Заблокированные слоты
```
GET    /api/blocked-slots          — Список блокировок (фильтр: dateRange)
POST   /api/blocked-slots          — Добавить блокировку
DELETE /api/blocked-slots/:id      — Снять блокировку
```

#### Галерея
```
GET    /api/gallery                — Список изображений
POST   /api/gallery                — Загрузить изображение (admin)
DELETE /api/gallery/:id            — Удалить изображение (admin)
```

#### Отзывы
```
GET    /api/reviews                — Список отзывов (фильтр: barberId, rating)
POST   /api/reviews                — Оставить отзыв (client, после appointment)
PATCH  /api/reviews/:id            — Обновить отзыв (admin: visibility)
```

#### Доступные слоты (ключевой endpoint)
```
GET    /api/slots/available        — Свободные слоты
Query: { date: "2026-08-15", barberId: "uuid", serviceId: "uuid" }
Response: {
  "date": "2026-08-15",
  "slots": [
    { "start": "10:00", "end": "11:00" },
    { "start": "11:00", "end": "12:00" },
    { "start": "14:00", "end": "15:00" }
  ]
}
Логика: WorkingHours - BlockedSlots - занятые Appointment = доступные слоты
```

---

## 5. Роли пользователей

| Роль | Доступ |
|---|---|
| **Гость** | Главная, услуги, галерея, отзывы, просмотр цен. Не может записаться. |
| **Клиент** | Всё из гостя + запись на услуги, личный кабинет, история, отзывы, отмена записи. |
| **Барбер** | Всё из клиента + управление расписанием, подтверждение/отклонение записей, портфолио, настройки. |
| **Администратор** | Полный доступ: управление услугами, пользователями, галереей, аналитика, системные настройки. |

---

## 6. Пользовательские сценарии

### Сценарий 1: Запись на услугу

```
Гость → Главная (WebGL сцена) → Услуги → Выбор услуги → Выбор барбера
  → Календарь (доступные слоты) → Время → Регистрация/Вход
  → Подтверждение записи → Email/SMS уведомление
  → Барбер получает уведомление → Подтверждает запись
  → Клиент получает подтверждение
  → За 24ч → Напоминание клиенту
  → За 2ч → Напоминание барберу
```

### Сценарий 2: Отмена записи

```
Клиент → Личный кабинет → Мои записи → Выбрать запись → Отменить
  → Причина отмены → Подтверждение
  → Барбер получает уведомление об отмене
  → Слот становится доступным для записи
```

### Сценарий 3: Создание рабочего дня

```
Барбер/Админ → Расписание → Настройка шаблона
  → Выбор дней недели → Часы работы (start/end)
  → Буфер между записями → Обеденное время
  → Сохранение → Расписание сгенерировано на недели вперёд
```

### Сценарий 4: Изменение расписания

```
Барбер → Расписание → Выбрать день
  → Добавить блокировку (отпуск/личные дела)
    → Даты, время, причина
    → Все записи в этом окне помечаются "barber unavailable"
    → Клиенты получают уведомление о переносе
  → Или изменить часы на конкретный день (перекрывает шаблон)
```

---

## 7. Безопасность

### JWT (Access + Refresh)
- Access token: 15 минут, содержит `userId`, `role`
- Refresh token: 7 дней, хранится в httpOnly cookie
- Refresh token хранится в БД (отозванный токен — немедленная блокировка)

### Rate Limit
- `/api/auth/*`: 5 попыток/мин (brute force protection)
- `/api/appointments`: 30 запросов/мин
- `/api/gallery`: 100 запросов/мин
- Использовать `upstash-rate-limiter` или `express-rate-limit` (через middleware)

### Валидация
- Zod схемы на всех входных данных (shared между клиентом и сервером)
- Санитизация rich text (DOMPurify на клиенте, sanitize-html на сервере)

### XSS
- React по умолчанию экранирует JSX
- CSP заголовки: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'`
- Никогда не использовать `dangerouslySetInnerHTML`

### CSRF
- SameSite=Strict для cookie
- CSRF token для форм (Next.js Server Actions)
- Методы: только GET и POST для браузерных запросов (семантические)

### SQL Injection
- Prisma ORM — параметризованные запросы по умолчанию
- Запрет на raw queries без code review

### File Upload Security
- Проверка MIME-типа на клиенте и сервере
- Максимальный размер: 5MB
- Только разрешённые форматы: JPEG, PNG, WebP
- Сканер на вредоносный код (sharp для пережатия)
- Уникальное имя файла (UUID), не оригинальное

### Helmet
- helmet() middleware для security headers:
  - Content-Security-Policy
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Strict-Transport-Security: max-age=63072000
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=()

### CORS
- Разрешён только production origin
- Методы: GET, POST, PATCH, DELETE
- Headers: Content-Type, Authorization
- Credentials: true (для cookie)

---

## 8. Производительность

### Lazy Loading
- Все компоненты ниже сгиба — `next/dynamic` с Suspense
- WebGL сцена — dynamic import, ssr: false
- Изображения в галерее — `loading="lazy"` + Intersection Observer

### Image Optimization
- `next/image` — автоматическая оптимизация, WebP/AVIF
- srcset для разных разрешений (480w, 768w, 1200w)
- Image CDN (Cloudflare Images / Vercel Image Optimization)

### Caching
- **Static pages**: ISR (Incremental Static Regeneration) для услуг, галереи
- **API**: React Query с staleTime для списков (services, working-hours)
- **Redis**: кэш доступных слотов (TTL: 1 минута или при изменении)
- **Service Worker**: stale-while-revalidate для статики

### Pagination
- Все списки: cursor-based pagination (UUID cursor, не offset)
- Размер страницы: 12 (галерея), 20 (отзывы), 10 (история записей)

### Memoization
- `React.memo` для тяжелых компонентов (GalleryGrid, ScheduleCalendar)
- `useMemo` для вычисляемых данных (доступные слоты, filtered services)
- `useCallback` для callback-пропсов в списках

### Virtualization
- Админ-панель: `react-window` для списка клиентов (100+ записей)
- Календарь с большим числом слотов

### Database Indexes
```prisma
model Appointment {
  @@index([barberId, startTime])     // Поиск записей барбера по дате
  @@index([clientId, status])         // История клиента
  @@index([startTime, status])        // Доступные слоты
}

model WorkingHours {
  @@unique([barberId, dayOfWeek])     // Один шаблон на день
}

model User {
  @@index([role])                     // Фильтр по роли
}
```

---

## 9. SEO

### Техническое SEO
- Next.js SSR/SSG для всех публичных страниц
- `generateMetadata` для каждой страницы (title, description, og:image)
- `sitemap.ts` — динамическая карта сайта
- `robots.txt` — правильные правила для индексации
- Structured data (JSON-LD): LocalBusiness, Service, Review

### JSON-LD (Schema.org)
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "BarberPro",
  "description": "Премиальный барбершоп",
  "url": "https://barberpro.ru",
  "telephone": "+7-999-123-45-67",
  "address": { ... },
  "openingHours": "Mo-Fr 09:00-20:00",
  "priceRange": "₽₽₽"
}
```

### Контент
- Уникальные meta-описания для каждой страницы
- Semantic HTML: `h1`, `h2`, `nav`, `main`, `section`, `article`
- Breadcrumbs (хлебные крошки)
- Open Graph + Twitter Cards для соцсетей

### Core Web Vitals
- LCP < 2.5s (priority hints на hero section)
- CLS < 0.1 (заданные размеры для изображений)
- INP < 200ms (code splitting, web workers)

---

## 10. Accessibility

### Standards
- WCAG 2.2 Level AA
- ARIA авторолей для кастомных компонентов
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Focus trap для модальных окон

### Implementation
- React Aria Components (Button, Dialog, Calendar, Select)
- `next/link` и `button` с правильными ролями
- skip-to-content link
- Цветовой контраст: 4.5:1 (text), 3:1 (large text)
- `prefers-reduced-motion` для WebGL и анимаций
- Alt тексты для всех изображений
- Form labels для всех полей ввода
- Error announcements для валидации форм (aria-live="polite")

---

## 11. Мобильная адаптация

### Breakpoints
| Название | Ширина | Особенности |
|---|---|---|
| Mobile | < 640px | Single column, bottom nav, WebGL отключён (статический фон) |
| Tablet | 640–1024px | 2 колонки, календарь compact, WebGL сниженная детализация |
| Desktop | > 1024px | Полная версия, WebGL сцена |

### Mobile-first
- Tailwind: `mobile:`, `sm:`, `md:`, `lg:` модификаторы
- Bottom navigation bar (мобильная навигация вместо sidebar)
- Touch-friendly: все кнопки min 44×44px
- Swipe gestures для галереи на мобильных
- Sticky header при скролле
- Календарь: horizontal scroll вместо недельной сетки

---



## 12. Структура компонентов React (Atomic Design + Feature-Sliced)

### Atoms (apps/web/src/components/ui)
```
Button/        — variant (primary/secondary/ghost), size, loading state
Input/         — text, email, phone, password с валидацией
Select/        — Dropdown с поиском
Modal/         — Dialog с focus trap, keyboard, overlay
Badge/         — Статусы (confirmed, cancelled, pending)
Avatar/        — Фото пользователя с fallback
Skeleton/      — Loading skeleton для всех типов контента
Calendar/      — Дата-пикер с доступными слотами
TimePicker/    — Выбор времени
Card/          — Карточка (service, review, gallery)
Toast/         — Уведомления (success, error)
Spinner/       — Loader
Icon/          — SVG иконки (inline, не шрифт)
Tooltip/
Tabs/
Accordion/
Switch/
RadioGroup/
Checkbox/
```

### Molecules (apps/web/src/components/shared)
```
Header/        — Лого, навигация, кнопки (публичная часть)
Footer/        — Контакты, соцсети, карта
Navbar/        — Навигационный бар
AuthGuard/     — Защита роутов по роли
ThemeToggle/   — Светлая/тёмная тема
SearchBar/     — Поиск услуг
Pagination/    — Пагинатор
Breadcrumbs/   — Хлебные крошки
CookieConsent/ — Согласие на cookie
```

### Features (apps/web/src/components/features)
```
booking-widget/
  ├── ServiceSelection.tsx     — Выбор услуги
  ├── BarberSelection.tsx      — Выбор барбера
  ├── DateTimePicker.tsx       — Календарь + время
  ├── BookingForm.tsx          — Контактные данные
  ├── BookingConfirmation.tsx  — Подтверждение
  └── BookingWidget.tsx        — Композиция (stepper)

schedule-calendar/
  ├── WeekCalendar.tsx         — Недельная сетка
  ├── DayColumn.tsx            — Колонка дня
  ├── TimeSlot.tsx             — Слот времени
  ├── AppointmentBlock.tsx     — Блок записи (drag)
  └── ScheduleCalendar.tsx     — Полный компонент

gallery-grid/
  ├── GalleryImage.tsx         — Изображение с lightbox
  ├── GalleryFilter.tsx        — Фильтр по категории
  ├── GalleryLightbox.tsx      — Просмотр в fullscreen
  └── GalleryGrid.tsx          — Masonry-сетка

review-card/
  ├── ReviewCard.tsx           — Карточка отзыва
  ├── ReviewForm.tsx           — Форма написания
  ├── ReviewList.tsx           — Список с пагинацией
  └── StarRating.tsx           — Рейтинг
```

### Templates (apps/web/src/components/layouts)
```
PublicLayout/      — Для публичных страниц (Header + main + Footer)
AuthLayout/        — Для логина/регистрации (центрированный контейнер)
DashboardLayout/   — Для личного кабинета (sidebar + main)
AdminLayout/       — Для админки (sidebar + topbar + main)
```

---

## 13. Структура админ-панели

```
AdminLayout/
├── Sidebar/          — Навигация (Dashboard, Schedule, Clients, Services, Gallery, Settings)
├── Topbar/           — Поиск, уведомления, профиль
└── Main/             — Контент

├── DashboardPage/
│   ├── StatsCards/         — Записи сегодня, выручка, новые клиенты
│   ├── TodaySchedule/      — Список записей на сегодня
│   ├── RevenueChart/       — График выручки (Recharts)
│   └── UpcomingAppointments/

├── SchedulePage/
│   ├── WeekCalendar/       — Drag & drop управление расписанием
│   ├── BlockedSlots/       — Управление блокировками
│   └── TimeOffModal/

├── ClientsPage/
│   ├── ClientTable/        — Таблица клиентов (виртуализация)
│   ├── ClientHistory/      — История записей клиента
│   └── ClientModal/        — Редактирование клиента

├── ServicesPage/
│   ├── ServiceList/        — Список услуг
│   ├── ServiceForm/        — Создание/редактирование
│   └── CategoryManager/    — Категории услуг

├── GalleryPage/
│   ├── GalleryGrid/        — Masonry-сетка
│   ├── UploadButton/       — Drag & drop загрузка
│   └── ImageEditor/        — Обрезка, фильтры

├── SettingsPage/
│   ├── BusinessInfo/       — Название, адрес, телефон
│   ├── WorkingHours/       — Шаблон расписания
│   ├── Notifications/      — Настройки уведомлений
│   └── Security/           — Смена пароля, 2FA

└── AnalyticsPage/
    ├── RevenueReport/      — Отчёт по выручке
    ├── PopularServices/    — Популярные услуги
    ├── ClientRetention/    — Удержание клиентов
    └── TimeAnalysis/       — Загруженность по часам
```

---

## 14. WebGL сцена

### Концепция
Премиальный барбершоп с тёплой, атмосферной сценой.

### Сцена
```
React Three Fiber (R3F) + drei
Dynamic import, ssr: false
- autoRotate не используется
- Плавное движение камеры (Catmull-Rom spline)
- Медленно вращающиеся инструменты (ножницы, бритва, расчёска)
- Частицы дыма (PointMaterial, ~50 частиц)
- Тёплый свет (PointLight + SpotLight)
- Металлические отражения (EnvironmentMap)
- Пост-процессинг: Bloom (умеренный) + ToneMapping (ACES)
```

### Компоненты сцены

```typescript
// Scene.tsx — корневой компонент сцены
// CameraController.tsx — движение камеры по сплайну (CatmullRomCurve3)
// BarberTools.tsx — 3D модели инструментов с анимацией вращения
// SmokeParticles.tsx — система частиц дыма (Points с шейдером)
// WarmLight.tsx — тёплое освещение (PointLight + SpotLight + GodRay)
// Stage.jsx — пол/фон с металлическим отражением
```

### Технические детали

| Параметр | Значение |
|---|---|
| Частицы дыма | 30–50 (mobile: 15) |
| Полигоны моделей | < 5K каждый (glTF compressed) |
| Текстуры | 1024×1024 max, BC7/ETC2 |
| FPS target | 60 (десктоп), 30 (мобильные) |
| Размер бандла | < 150KB (gzipped, lazy loaded) |
| Пост-процессинг | Bloom только на светящиеся элементы |
| Reduced motion | Статичная сцена (один кадр, без RAF) |
| Fallback | `<div>` с градиентным фоном при ошибке загрузки |

### Производительность
- `detect-gpu` — определение уровня GPU
- Low-tier: WebGL отключён (CSS градиент)
- Mid-tier: 30 частиц, без Bloom, модели reduced
- High-tier: полная сцена

### GLSL (кратко)
```glsl
// Smoke vertex shader — смещение частиц по синусоиде + время
// Smoke fragment shader — мягкий градиент (белый → прозрачный)
// Light shaft shader (optional) — световые лучи через геометрию
```

---

## 15. Quality Gate — Аудит архитектуры

### Сильные стороны

| Аспект | Статус |
|---|---|
| Type safety | tRPC + Prisma + Zod — end-to-end типы |
| Separation of concerns | Feature-Sliced + Atomic Design чётко разделяют зоны |
| Performance | ISR, Redis кэш, lazy loading, cursor pagination |
| Security | JWT + refresh rotation, CSP, CSRF, Helmet |
| Scalability | PostgreSQL индексы, BullMQ очереди, stateless API |
| DX | Shared types, Storybook, pre-commit hooks, lint-staged |

### Слабые места и улучшения

| Слабое место | Риск | Улучшение |
|---|---|---|
| Next.js API Routes на одном инстансе с фронтом | При росте трафика API конкурирует за resources с рендерингом | Выделить отдельный Fastify/NestJS backend + Docker Compose, оставить Next.js только для frontend |
| tRPC привязывает клиент и сервер к одному проекту | Масштабирование на десятки мастеров потребует отдельного API | Сохранить tRPC для v1, но сразу изолировать серверные процедуры в отдельный пакет для миграции на REST/gRPC |
| Single PostgreSQL экземпляр | Single point of failure | Добавить реплику (read replica) для аналитики и чтения расписания |
| Изображения в Cloudflare R2 без трансформаций on-the-fly | Нужно генерировать разные размеры при загрузке | Добавить Sharp pipeline при upload (thumbnail, medium, full) |
| Нет автотестов на WebGL | Рендеринг может сломаться без регрессии | Добавить snapshot-тесты с Puppeteer для визуальной регрессии |
| Отсутствие offline-first для админки | Барбер может потерять расписание при проблемах с сетью | Local-first архитектура (IndexedDB) с sync engine (CRDT) для v2 |
| Нет multi-tenant архитектуры | При масштабировании на 10+ барберов данные могут пересекаться | Добавить поле `organizationId` во все таблицы на этапе миграции v2 |
| Нет подробного описания очередей | BullMQ без worker-ков потребляет память | Вынести worker в отдельный процесс (Docker container) с мониторингом через Bull Board |
| PATCH запросы без versioning | Конфликты при одновременном редактировании расписания | Оптимистичная блокировка (version field в Appointment) |

### Рекомендации для v2
1. **Multi-tenant** — организация с несколькими барберами
2. **Offline-first** — CRDT + IndexedDB для расписания
3. **Система лояльности** — бонусы и скидки
4. **Интеграция с Google Calendar / Yandex Calendar**
5. **Telegram-бот** для записи и уведомлений
6. **Онлайн-оплата** — ЮKassa / Stripe
7. **Мобильное приложение** — React Native (share types)
8. **Видео-консультации** — WebRTC

---

*Документ завершён. Код не писался.*
