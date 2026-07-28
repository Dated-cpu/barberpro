# BarberPro — Backend Setup

## Requirements

- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (optional, for rate limiting)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env
# Edit .env with your database credentials

# 3. Run database migration
npm run db:migrate

# 4. Seed development data
npm run db:seed

# 5. Start development server
npm run dev
```

## Project Structure

```
apps/web/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Development seed data
├── src/
│   ├── server/
│   │   ├── config/      # Environment validation (Zod)
│   │   ├── db/          # Prisma client + transaction helpers
│   │   ├── lib/         # JWT, hashing, logger, errors, events
│   │   ├── repositories/# Data access layer (Repository pattern)
│   │   └── services/    # Business logic layer
│   ├── trpc/
│   │   ├── context.ts   # tRPC context (auth, requestId, IP)
│   │   ├── trpc.ts      # tRPC init + procedures (public, protected, admin, barber)
│   │   ├── middleware/   # Auth validation, rate limiting
│   │   └── routers/     # API route handlers
│   ├── validators/      # Zod schemas (shared between client & server)
│   ├── types/           # TypeScript type definitions
│   └── middleware.ts    # Next.js edge middleware (security headers)
└── tests/               # Vitest tests
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Run all tests |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed development data |
| `npm run db:studio` | Open Prisma Studio |

## Environment Variables

See `.env.example` for all required variables.
