import { RedisThrottlerStorage } from './redis-throttler.storage';

describe('RedisThrottlerStorage', () => {
  const buildRedis = (result: [number, number, number, number]) => ({
    eval: jest.fn().mockResolvedValue(result),
  });

  it('reports an unblocked hit and converts milliseconds to seconds', async () => {
    // 2 hits so far, 45s left on the window, not blocked.
    const redis = buildRedis([2, 45_000, 0, 0]);
    const storage = new RedisThrottlerStorage(redis as any);

    await expect(
      storage.increment('tracker-key', 60_000, 5, 60_000, 'default'),
    ).resolves.toEqual({
      totalHits: 2,
      timeToExpire: 45,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
  });

  it('reports a blocked hit with the remaining block window in seconds', async () => {
    const redis = buildRedis([6, 0, 1, 30_000]);
    const storage = new RedisThrottlerStorage(redis as any);

    await expect(
      storage.increment('tracker-key', 60_000, 5, 60_000, 'default'),
    ).resolves.toEqual({
      totalHits: 6,
      timeToExpire: 0,
      isBlocked: true,
      timeToBlockExpire: 30,
    });
  });

  it('passes both keys and all three arguments to the Lua script', async () => {
    const redis = buildRedis([1, 60_000, 0, 0]);
    const storage = new RedisThrottlerStorage(redis as any);

    await storage.increment('tracker-key', 60_000, 5, 90_000, 'default');

    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining('INCR'),
      2,
      'throttle:default:tracker-key',
      'throttle:blocked:default:tracker-key',
      60_000,
      5,
      90_000,
    );
  });
});
