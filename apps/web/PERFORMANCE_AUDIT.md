# Performance Audit — BarberPro

> Все проблемы найдены. Изменения бизнес-логики нет.  
> План: каждый пункт = fix в отдельной задаче.

---

## 1. Bundle Size

### Critical

| Dep | Size (approx) | Used in | Note |
|-----|--------------|---------|------|
| `three` + `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing` | ~500 KB | `BarberExperienceDynamic.tsx` | Уже dynamic import + ssr:false ✅, но всё ещё попадает в shared bundle через chunks |
| `gsap` | ~100 KB | `ScrollTimeline.tsx`, `ExperienceContent.tsx` | Не изолирован, тянется в layout |
| `@aws-sdk/client-s3` | ~200 KB | `media.ts` (server) | Серверный модуль — не попадает в client bundle, но увеличивает Lambda размер |

### Pages with largest First Load JS

| Page | Size | Why |
|------|------|-----|
| `/barber/portfolio` | 147 kB | Client page + portfolio queries |
| `/booking` | 146 kB | Multi-step form, 593 строки |
| `/profile` | 140 kB | Profile form + history |
| `/auth/login` | 141 kB | Login form |
| `/barber` | 142 kB | Dashboard with overview |

**Middle JS shared**: 103 kB  

### Recommendations
1. **Isolate gsap** → dynamic import в `ScrollTimeline.tsx` (сейчас импортирован статически)
2. **Lazy load booking page** → `next/dynamic` для шагов формы
3. **Remove `winston`** → заменить на `pino` (winston ~100KB, pino ~10KB) или `console` в dev
4. **Bundle analyzer** — добавить `@next/bundle-analyzer` в CI

---

## 2. Server Components / Client Components Balance

### Layout analysis

| Layout | use client? | Imports client components | Forces children into client? |
|--------|------------|--------------------------|-----------------------------|
| `root layout.tsx` | ❌ No | `TRPCProvider`, `ToastProvider` | ✅ Да — оба provider клиентские |
| `(public)/layout.tsx` | ❌ No | `Header` | ✅ Да — Header клиентский |
| `admin/layout.tsx` | ❌ No | `DashboardSidebar`, `MobileDashboardNav`, `DashboardHeader` | ✅ Да — 3 клиентских компонента |
| `barber/layout.tsx` | ❌ No | (same as admin) | ✅ Да |
| `auth/layout.tsx` | ❌ No | (no client imports) | ❌ Нет — может быть Server Component |
| `booking/layout.tsx` | ❌ No | `Header`, `Footer` | ✅ Да — Header клиентский |

**Итог**: практически все страницы в client boundary из-за layout.

### `use client` count: 49 файлов
- 23 page.tsx (из 37 страниц)
- 22 shared/ui/scene компонента
- 3 providers (TRPC, Toast)
- 1 error.tsx

### Unnecessary `use client` candidates
| File | Why it exists | Fix |
|------|-------------|-----|
| `components/ui/button.tsx` | Только `cva` + className | Убрать `use client` |
| `components/ui/card.tsx` | Только `cn()` + className | Убрать `use client` |
| `components/ui/modal.tsx` | useState для открытия | Нужен client, но можно вынести триггер наружу |
| `components/shared/social-links-footer.tsx` | Статические ссылки | Убрать `use client` |
| `components/shared/page-header.tsx` | Нужно проверить | Вероятно, не нужен |

### Hydration cost areas
- `dashboard-sidebar.tsx` — `usePathname()` для активной ссылки — можно заменить на Server Component с `useSelectedLayoutSegment()`
- `header.tsx` — `useState` для мобильного меню + `useEffect` для закрытия при навигации — минимально, но тянет весь header в client

### Recommendations
1. **Вынести `TRPCProvider` ниже** — только в client-страницы, не в root layout
2. **Убрать `use client`** из button.tsx, card.tsx, social-links-footer.tsx, page-header.tsx
3. **Заменить `usePathname` в sidebar** на пропсы из Server layout
4. **Сделать Header Server Component** с маленьким клиентским islands для mobile menu toggle
5. **Auth layout** — убедиться что не импортирует клиентские компоненты

---

## 3. Database Queries (N+1, Over-fetching)

### N+1 Patterns

| File | Line | Pattern | Impact |
|------|------|---------|--------|
| `services/portfolio.ts` | 30-38 | `for` loop с `await tx.portfolioImage.create()` для каждого imageId | **Medium** — 1 query per image. Исправить на `createMany()` |
| `services/dashboard.ts` | 74-125 | `Promise.all` из 7 запросов | **Low** — параллельные, но много. Кэшировать. |
| `services/availability.ts` | 32-133 | 6+ последовательных запросов в transaction | **Medium** — много запросов на каждый вызов |
| `services/reviews.ts` | 74-79 | 5 отдельных `count` + 1 aggregate | **Low** — можно 1 запросом с groupBy |
| `services/admin.ts` | 56-61 | 2 отдельных `findUnique` для проверки дубликатов | **Low** — 2 запроса, можно 1 |

### Over-fetching via `include`

| File | Include depth | Problem |
|------|-------------|---------|
| `services/admin.ts:27` | `client: { select }`, `barber: { select }`, `service: { select }` | ✅ Нормально, select ограничен |
| `services/reviews.ts:16` | `client.avatar.url`, `appointment.service.name`, `appointment.barber`, `moderator` | ⚠️ Запрос тянет moderator даже когда не нужен |
| `services/dashboard.ts:17` | `client: {select}`, `service: {select}` | ✅ Нормально |
| `services/dashboard.ts:168` | `service: { name, category }` | ✅ Нормально |
| `services/portfolio.ts:11` | `images.media.{id,url,thumbnailUrl,alt}` | ✅ Нормально |

### Missing Indexes

| Table | Column | Why needed |
|-------|--------|------------|
| `User` | `role` | Только composite с `isActive` — single role filter без isActive не покрывается |
| `AuditLog` | `(action, createdAt)` | Есть, но порядок полей критичен для securityEvents фильтра |
| `Appointment` | `(barberId, status)` | Есть, но с `startTime` — если фильтр только по status, index не используется |

### Recommendations
1. **portfolio.ts** — заменить `for` loop на `createMany()`
2. **dashboard.ts** — добавить `React.cache()` для `getDashboardOverview`
3. **reviews.ts getStats** — заменить 5 count на 1 `groupBy`
4. **Добавить композитный индекс** на `AuditLog(action, createdAt)`

---

## 4. Caching

### Current state: ❌ No data caching
- `unstable_cache()` — не используется
- `React.cache()` — не используется
- Redis — только rate limiting
- No SWR/stale-while-revalidate for any data

### Caching opportunities

| Data | TTL | Strategy | Impact |
|------|-----|----------|--------|
| `dashboard.overview` | 30s | `React.cache()` + `unstable_cache()` | High |
| `availability.getAvailableSlots` | 15s | `React.cache()` | High (частый вызов при бронировании) |
| `services.list` | 5min | `unstable_cache()` | Medium |
| `barbers.list` | 5min | `unstable_cache()` | Medium |
| `reviews.list` (public) | 60s | `unstable_cache()` | Medium |
| `portfolio.listByBarber` | 60s | `React.cache()` | Low |
| `settings.get` | 5min | `unstable_cache()` | Medium |

### Recommendations
1. **Создать Redis cache layer** — `getOrSet(key, fetcher, ttl)` используя существующий Redis client
2. **Обернуть dashboard/availability** в `React.cache()` для deduplication в рамках request
3. **Добавить `unstable_cache()`** для медленных публичных данных (services, barbers)

---

## 5. Images

### Current configuration (`next.config.ts`)
```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
    { protocol: 'https', hostname: '*.amazonaws.com' },
  ],
}
```
❌ Нет `formats: ['image/avif', 'image/webp']`  
❌ Нет `deviceSizes`/`imageSizes`  
❌ Нет `minimumCacheTTL`

### Usage audit

| File | Usage | Priority? | Sizes? | Lazy? |
|------|-------|-----------|--------|-------|
| `hero-cinematic.tsx` | `<Image fill priority />` | ✅ priority | ✅ sizes="100vw" | ✅ LCP |
| `master/page.tsx` | `<Image fill />` | ⚠️ нет priority (выше fold) | ❌ нет sizes | ⚠️ Default lazy |
| `barber/portfolio/page.tsx` | Image import | ❌ не проверено | ❌ | ❌ |

### Recommendations
1. **Добавить в next.config.ts**: `formats: ['image/avif', 'image/webp']`, `deviceSizes`, `minimumCacheTTL`
2. **Master page** — добавить `priority` на hero image (выше fold)
3. **Portfolio images** — проверить что все portfolio изображения используют `next/image` с правильными sizes
4. **Добавить `placeholder="blur"`** для above-fold images с `blurDataURL`

---

## 6. Summary Priority Matrix

| Priority | Issue | File(s) | Impact | Effort |
|----------|-------|---------|--------|--------|
| 🔴 P0 | N+1 в portfolio.create (for loop) | `services/portfolio.ts:30` | High (каждое изображение = query) | Low (createMany) |
| 🔴 P0 | 7 параллельных запросов в dashboard | `services/dashboard.ts:74-125` | High (каждая загрузка страницы) | Medium (cache + dedup) |
| 🔴 P0 | Нет image formats/optimization | `next.config.ts` | High (WebP/AVIF экономия ~40%) | Low |
| 🟠 P1 | Unnecessary `use client` в button/card | 4 UI files | Medium (раздувает client bundle) | Low |
| 🟠 P1 | gsap не изолирован | `ScrollTimeline.tsx` | Medium (100KB в layout) | Low (dynamic import) |
| 🟠 P1 | Header client boundary в public layout | `(public)/layout.tsx` | Medium (все страницы клиентские) | Medium (island extraction) |
| 🟠 P1 | No Redis data caching | — | Medium (повторные запросы) | Medium |
| 🟡 P2 | Sidebar client из-за usePathname | `dashboard-sidebar.tsx` | Low (но влияет на admin/barber layout) | Low |
| 🟡 P2 | reviewStats — 5 count запросов | `services/reviews.ts:74-79` | Low | Low (groupBy) |
| 🟡 P2 | Auth layout без client imports (хорошо) | ✅ использовать паттерн | — | — |

---

## Files to change (без изменения бизнес-логики)

1. `next.config.ts` — +image formats/deviceSizes
2. `src/components/ui/button.tsx` — удалить `use client`
3. `src/components/ui/card.tsx` — удалить `use client`
4. `src/components/shared/social-links-footer.tsx` — удалить `use client`
5. `src/components/shared/page-header.tsx` — проанализировать
6. `src/server/services/portfolio.ts` — заменить `for` loop на `createMany`
7. `src/server/services/dashboard.ts` — добавить `React.cache()`
8. `src/server/services/reviews.ts` — groupBy вместо 5 count
9. `src/components/shared/dashboard-sidebar.tsx` — пропсы вместо usePathname
10. `src/components/scene/BarberExperienceLite/ScrollTimeline.tsx` — dynamic import gsap
11. `src/server/security/redis.ts` — +getOrSet cache helper
12. `src/components/shared/header.tsx` — Server Component + client island
