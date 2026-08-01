# Единая архитектура получения текущего пользователя (AuthContext)

## 1. Причина проблемы

Аудит показал: `auth.me` читался независимо в **4 местах** с разными опциями:

| Место | Было |
|-------|------|
| `components/shared/user-menu.tsx` | `auth.me.useQuery(undefined, { retry: false })` |
| `components/hero/personal-welcome.tsx` | `auth.me.useQuery(undefined, { retry: false })` |
| `components/shared/dashboard-header.tsx` | `auth.me.useQuery()` (дефолтные опции) |
| `app/profile/page.tsx` | `auth.me.useQuery(undefined, { retry: false })` + `useEffect`-редирект на `/auth/login` при `userError \|\| !user` |

Отсюда два дефекта:

1. **Закэшированная ошибка 401.** Кэш react-query держит ошибку запроса долго (gcTime 5 мин по умолчанию). Если в любой момент access token истёк и refresh в fetch-линке не успел/не сработал (один 401 при ротации токенов), ошибка попадает в общий кэш `['auth','me']` — и **все страницы**, читающие этот ключ, видят гостя.
2. **Редирект «по незнанию».** `profile/page.tsx` редиректил на `/auth/login` от `userError || !user` — т.е. и от временной ошибки кэша, и в момент, когда профиль ещё грузился. Пользователь оказывался на странице логина, будучи авторизованным → «предлагает войти снова».

## 2. Изменённые компоненты

| Файл | Изменение |
|------|-----------|
| `src/lib/auth-context.tsx` | **Новый**: `AuthProvider` + `useCurrentUser()` — единственное место чтения `auth.me` (фиксированные опции: `retry: false`, `staleTime: 60s`, `gcTime: Infinity`) + авто-восстановление сессии (при ошибке один раз вызывает существующий `auth.refresh` и `invalidate`) |
| `src/trpc/provider.tsx` | `AuthProvider` оборачивает приложение внутри `trpc.Provider`/`QueryClientProvider` |
| `src/components/shared/user-menu.tsx` | `useCurrentUser()` вместо собственного `useQuery` |
| `src/components/hero/personal-welcome.tsx` | `useCurrentUser()` вместо собственного `useQuery` |
| `src/components/shared/dashboard-header.tsx` | `useCurrentUser()` вместо собственного `useQuery` |
| `src/app/profile/page.tsx` | `useCurrentUser()`; редирект на логин **только** при `isError && !isLoading` (ошибка, подтверждённая после попытки refresh), а не от `!user` |

## 3. Новая архитектура получения currentUser

```
root layout
 └─ TRPCProvider (trpc.Provider + QueryClientProvider)
     └─ AuthProvider  ← единственный владелец кэша ['auth','me']
         ├─ user-menu (Header)          → useCurrentUser()
         ├─ personal-welcome (Hero)     → useCurrentUser()
         ├─ dashboard-header            → useCurrentUser()
         ├─ profile/page                → useCurrentUser()
         └─ все остальные страницы
```

- **Один источник истины**: весь сайт подписан на один кэшированный `auth.me` (`gcTime: Infinity` — состояние не «выпадает» при навигации между страницами).
- **Восстановление сессии**: единственная точка, которая при ошибке сессии вызывает существующий `auth.refresh` и перечитывает профиль — вместо мгновенного показа гостя.
- **Логин/логаут**: существующие `utils.auth.me.invalidate()` после `login`/`logout` обновляют единый кэш — изменение мгновенно видно на всех страницах.
- **Refresh страницы**: `AuthProvider` смонтирован в корне → `auth.me` запрашивается сразу, любая страница (Главная, Мастер, Контакты, Профиль, История, Запись) получает состояние до первого рендера своих потребителей.

## 4. Проверки
- `tsc --noEmit` — ✅ 0 ошибок
- `npm run lint` — ✅ 0 ошибок (1 pre-existing warning в `verify-email/page.tsx`)
- `npx next build` — ✅ сборка успешна
- `vitest run` — ✅ 202/202 тестов (14 файлов)

## 5. Безопасность: не менялась
- Cookies (httpOnly), middleware, CSRF, RBAC, permissions, audit, rate-limit, auth flow — **не тронуты**.
- `auth.me`, `auth.refresh` — существующие процедуры (protected/public), используются как есть.
- Менялась только клиентская архитектура чтения текущего пользователя; ownership-проверки на сервере не изменялись.
