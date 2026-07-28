# BarberPro — API Structure

## Architecture

Uses **tRPC** for end-to-end type-safe API. All API routes are served at `/api/trpc`.

## Available Procedures

### Auth Router (`/api/trpc/auth.*`)

| Procedure | Type | Auth | Input | Description |
|-----------|------|------|-------|-------------|
| `auth.register` | Mutation | Public | `{ firstName, lastName, phone, password, email? }` | Register new client |
| `auth.login` | Mutation | Public | `{ login, password }` | Login with email or phone |
| `auth.refresh` | Mutation | Public | `{ refreshToken }` | Refresh access token |
| `auth.logout` | Mutation | Protected | `{ refreshToken }` | Logout current device |
| `auth.logoutAll` | Mutation | Protected | — | Logout all devices |
| `auth.me` | Query | Protected | — | Get current user profile |

## Error Handling

All errors follow tRPC convention:

```json
{
  "error": {
    "message": "Invalid credentials",
    "code": "UNAUTHORIZED",
    "data": { "code": "UNAUTHORIZED", "httpStatus": 401 }
  }
}
```

| HTTP Status | tRPC Code | Description |
|------------|-----------|-------------|
| 400 | `BAD_REQUEST` | Validation error |
| 401 | `UNAUTHORIZED` | Invalid or missing credentials |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Duplicate resource |
| 429 | `TOO_MANY_REQUESTS` | Rate limit exceeded |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected error |

## Authentication Flow

1. **Register/Login** → returns `{ user, tokens: { accessToken, refreshToken, expiresAt } }`
2. Access token (15min) → sent in `Authorization: Bearer <token>` header
3. Refresh token (7d) → sent to `/api/trpc/auth.refresh` to get new tokens
4. Refresh token hashed in DB, supports rotation (old token revoked on use)
5. Token family detection: if compromised token is reused → entire family revoked

## Protected Routes

- `protectedProcedure` — requires valid JWT, any authenticated user
- `adminProcedure` — requires ADMIN or SUPER_ADMIN role
- `barberProcedure` — requires BARBER, ADMIN, or SUPER_ADMIN role
