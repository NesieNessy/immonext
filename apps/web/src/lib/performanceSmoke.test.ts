import { describe, expect, it } from 'vitest';
import { db } from '@/lib/server/db';

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe('database performance smoke test', () => {
  const testFn = hasDatabase ? it : it.skip;

  testFn('connects to the database and executes a sample query within an acceptable time', async () => {
    const start = Date.now();
    const result = await db.query('SELECT 1 AS ok');
    const duration = Date.now() - start;

    expect(result.rows[0]?.ok).toBe(1);
    expect(duration).toBeLessThan(2000);
  });
});
