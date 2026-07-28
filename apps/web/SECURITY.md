# BarberPro — Security Architecture

## Authentication

- **JWT Access Token** (15min) — contains `userId`, `role`
- **JWT Refresh Token** (7d) — contains `userId`, `tokenFamily`
- Refresh tokens stored as SHA-256 hashes in DB
- Token rotation: old token revoked when new one is issued
- Token family detection: reuse of revoked token revokes entire family

## HTTP Security Headers

Set by `src/middleware.ts`:

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | Restricted, see middleware.ts |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` |
| `Permissions-Policy` | Restricted camera, microphone, geolocation |

## Password Policy

- Minimum 8 characters
- Requires uppercase letter
- Requires digit
- Hashed with bcrypt (12 rounds)
- Never stored in plain text
- No logging of passwords or password hashes

## Rate Limiting

- In-memory rate limiter (Redis-backed for production)
- Configurable window and max requests via env vars
- Applied per IP address
- Login endpoints rate limited at 5 requests/minute

## Input Validation

- All inputs validated with Zod schemas
- Schemas shared between client and server
- Phone numbers validated with regex (`+7XXXXXXXXXX`)
- UUID validation on all ID parameters

## CSRF Protection

- SameSite=Strict cookie policy (when cookies implemented)
- State-changing operations require authentication
- Next.js Server Actions have built-in CSRF protection

## Database Security

- Parameterized queries via Prisma ORM (no raw SQL)
- Connection string from environment variables only
- Soft delete on all business entities (no data loss)
- Audit log for all admin actions

## Error Handling

- No stack traces in production responses
- Structured logging (Winston) with request IDs
- tRPC error codes mapped to appropriate HTTP status codes

## Future Improvements

- [ ] Two-factor authentication (TOTP)
- [ ] API key management for third-party integrations
- [ ] IP allowlist for admin endpoints
- [ ] Webhook signatures for outgoing events
- [ ] Automated security scanning (npm audit in CI)
- [ ] Penetration testing before production launch
