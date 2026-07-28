import { beforeAll, afterAll } from 'vitest';

process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/barberpro_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-32-chars-long-here!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-chars-long-here!';
(process.env as any).NODE_ENV = 'test';
process.env.APP_URL = 'http://localhost:3000';
process.env.CORS_ORIGIN = 'http://localhost:3000';

beforeAll(() => {
});

afterAll(() => {
});
