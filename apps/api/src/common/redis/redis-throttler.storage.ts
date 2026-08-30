import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

/**
 * `ThrottlerStorageRecord` isn't re-exported from the package index (only from a
 * `dist/` deep path), so the shape is restated here rather than importing across a
 * build artefact boundary. Structural typing keeps it compatible.
 */
interface ThrottlerRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/**
 * Redis-backed counter for @nestjs/throttler.
 *
 * The bundled in-memory storage keeps its counters in a process-local Map, so the
 * rate limit resets on every restart and is not shared across instances. Redis is
 * already a hard dependency of this app (BullMQ, auth tokens), so the limit lives
 * there instead — no new package needed.
 *
 * Contract (from @nestjs/throttler v6): `ttl` and `blockDuration` arrive in
 * milliseconds; `timeToExpire` and `timeToBlockExpire` are returned in seconds.
 */
const INCREMENT_SCRIPT = `
local hitsKey = KEYS[1]
local blockKey = KEYS[2]
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local blockDuration = tonumber(ARGV[3])

local blockTtl = redis.call('PTTL', blockKey)
if blockTtl > 0 then
  local blockedHits = tonumber(redis.call('GET', hitsKey) or '0')
  return { blockedHits, 0, 1, blockTtl }
end

local hits = redis.call('INCR', hitsKey)
if hits == 1 then
  redis.call('PEXPIRE', hitsKey, ttl)
end

local hitsTtl = redis.call('PTTL', hitsKey)
if hitsTtl < 0 then
  hitsTtl = ttl
end

if hits > limit then
  redis.call('SET', blockKey, '1', 'PX', blockDuration)
  return { hits, hitsTtl, 1, blockDuration }
end

return { hits, hitsTtl, 0, 0 }
`;

const toSeconds = (milliseconds: number) => Math.ceil(milliseconds / 1000);

export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerRecord> {
    const hitsKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `throttle:blocked:${throttlerName}:${key}`;

    const [totalHits, timeToExpire, isBlocked, timeToBlockExpire] =
      (await this.redis.eval(
        INCREMENT_SCRIPT,
        2,
        hitsKey,
        blockKey,
        ttl,
        limit,
        blockDuration,
      )) as [number, number, number, number];

    return {
      totalHits,
      timeToExpire: toSeconds(timeToExpire),
      isBlocked: isBlocked === 1,
      timeToBlockExpire: toSeconds(timeToBlockExpire),
    };
  }
}
