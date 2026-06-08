import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:54322/postgres';

const globalForDb = globalThis as typeof globalThis & {
  immonextPgPool?: Pool;
};

export const db =
  globalForDb.immonextPgPool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.immonextPgPool = db;
}

export const DEV_USER_ID = '00000000-0000-4000-8000-000000000001';
