# Customer Dashboard Audit

## 1. Customer Pages

| Page | URL | Features |
|------|-----|----------|
| Profile | `/profile` | Profile edit, upcoming appointment, history, customer stats, password change, session management |
| Booking | `/booking` | Multi-service selection, date/time picker, guest/user booking, consent, ICS download |

**Missing pages:** No dedicated dashboard page; profile doubles as dashboard.

---

## 2. Available Data: Backend → Frontend

### From `appointment.myUpcoming`
- `id`, `startTime`, `endTime`, `status`, `priceAtBooking`, `durationAtBooking`
- `service: { id, name, duration, price }`
- `appointmentServices: [{ id, serviceId, priceAtBooking, durationAtBooking, service }]`
- `barber: { id, firstName, lastName }`
- `branch: { id, name, address }`

✅ Includes multi-service data.

### From `appointment.myHistory` (paginated, cursor-based)
- Same as `myUpcoming` minus `branch`

### From `appointment.myStats`
- `totalVisits` — only COMPLETED appointments counted
- `totalSpent` — sum of COMPLETED prices
- `firstVisitDate` — earliest appointment
- `favoriteService: { name, count }`
- `favoriteBarber: { name, count }`

**Missing from stats:**
- ❌ `avgCheck` (totalSpent / totalVisits)
- ❌ `lastVisitDate`
- ❌ Cancelled/no-show counts

### From `auth.me`
- `id`, `firstName`, `lastName`, `phone`, `email`, `role`, `createdAt`

---

## 3. Data Available in DB But Not Used

| Model | Available Fields | Frontend Usage |
|-------|-----------------|----------------|
| `Appointment` | `cancelledAt`, `cancelReason`, `cancelledBy`, `source`, `clientNotes` | Not displayed anywhere |
| `Appointment` | `notes` (barber notes) | Not displayed to client |
| `Appointment` | `paymentStatus`, `paymentId` | Not displayed |
| `Review` | Full model exists | Client has no review writing UI |
| `Notification` | Full model exists, `type: NotificationType` enum has `APPOINTMENT_CREATED`, `APPOINTMENT_CONFIRMED`, `APPOINTMENT_REMINDER`, etc. | No UI for notifications |
| `Service` | `category`, `description`, `imageId` | Not shown to customer when booking |
| `User` | `createdAt` — shown in profile header | Partial |

---

## 4. UX Problems in Booking Flow

1. **No total duration hint on service selection** — Услуги show individual duration but no "Ваш визит займет X минут" summary
2. **Service step has "Всего" but no "+" separator between services** — the total is shown but no visual "Service1 + Service2 = Total" pattern
3. **No back-navigation from confirm screen** — only "Записаться ещё" and profile link
4. **Consent step location** — consents are on the info step, the user fills name/phone then sees 4 checkboxes before the submit button, no prior hint
5. **No timezone display** — hardcoded `+03:00`
6. **No service image** — only text cards

---

## 5. UX Problems in Customer Cabinet

1. **Profile page = dashboard** — mix of profile editing, appointment data, and stats feels cluttered
2. **No empty state CTA for history** — if history is empty, text says "У вас пока нет записей" but no "Записаться" button
3. **Stats component hides entirely when totalVisits === 0** — new users see nothing
4. **No "Повторить запись" button** — clients must manually re-select all services
5. **No average check display** — even though calculable from stats
6. **No last visit date** — `firstVisitDate` is shown conceptually but not exposed in UI
7. **No appointment count by status** — only total visits (completed)
8. **History has no date filters** — only cursor-based pagination ("Показать ещё")
9. **Upcoming card shows service names with no total** — in multi-service mode, individual services listed but no total duration/price breakdown (data exists in `priceAtBooking` / `durationAtBooking`)
10. **No booking confirmation text** — confirm screen says "Мы отправили подтверждение на ваш телефон" but there's no SMS implementation

---

## 6. Empty States Analysis

| Component | Current | Should Be |
|-----------|---------|-----------|
| History (no data) | "У вас пока нет записей" | Add CTA "Записаться впервые" |
| Upcoming (no upcoming) | "У вас нет предстоящих записей" | Add CTA "Записаться" |
| Stats (no visits) | Component is hidden (returns null) | Show minimal stats with booking CTA |
| Services (no active) | "Услуги временно недоступны" | OK |
| No barber | "Запись временно недоступна" | OK |

---

## 7. Security Checks

| Check | Status | Evidence |
|-------|--------|----------|
| Client sees only own appointments | ✅ | `findByClient(tx, clientId)` filters by `clientId` |
| Client cannot get other's stats | ✅ | `getMyStats(clientId)` uses own id |
| Ownership enforced server-side | ✅ | `assertAppointmentAccess()` checks clientId/barberId, allows ADMIN bypass |
| CSRF protection | ✅ | Middleware validates cookie/header match |
| Rate limiting on create | ✅ | 20/hour per IP |
| Guest users isolated | ✅ | Guest creates temp CLIENT user, all future lookups by phone |
| Auth uses httpOnly cookies | ✅ | No localStorage tokens |
| RBAC enforced | ✅ | All procedures use `protectedProcedure` or `publicProcedure` with explicit guards |

---

## 8. Existing Notification Infrastructure

- `prisma/schema.prisma` has `Notification` model with `type: NotificationType` enum
- `APPOINTMENT_REMINDER` type exists
- No `AppointmentReminder` model (separate tracking table)
- No reminder scheduling logic
- No email/SMS sending

---

## 9. Summary of Gaps

1. **Dashboard UX** — profile page is overloaded, needs clearer separation
2. **Repeat booking** — no "повторить запись" feature
3. **Empty states** — missing CTAs for new users
4. **Stats** — missing avgCheck, lastVisitDate
5. **History** — no date range filters
6. **Booking flow** — no duration hint, no "+" separator between services
7. **Notifications** — `AppointmentReminder` model doesn't exist yet
8. **Review system** — model exists but client can't write reviews
