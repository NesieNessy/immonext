import Redis from 'ioredis';

let _client: Redis | null = null;

export function getRedisClient(): Redis {
  if (!_client) {
    const url = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
    _client = new Redis(url);
  }
  return _client;
}

export async function closeRedis() {
  if (_client) {
    await _client.quit();
    _client = null;
  }
}

/** Drops every cached settlement-aggregate entry for a user's property, across all units, so a write is reflected immediately instead of waiting out the cache TTL. */
export async function invalidateSettlementCache(userId: string, propertyId: number): Promise<void> {
  const client = getRedisClient();
  const pattern = `settlement:user:${userId}:property:${propertyId}:*`;
  let cursor = '0';
  do {
    const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    if (keys.length > 0) await client.del(...keys);
    cursor = nextCursor;
  } while (cursor !== '0');
}
