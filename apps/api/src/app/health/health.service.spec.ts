import { HealthService } from './health.service';

describe('HealthService', () => {
  afterEach(() => jest.useRealTimers());

  it.each(['database', 'redis'] as const)(
    'reports down within 5 seconds when %s never answers',
    async (stalled) => {
      jest.useFakeTimers();
      const never = () => new Promise<never>(() => undefined);
      const service = new HealthService(
        {
          $queryRaw: jest.fn(
            stalled === 'database' ? never : async () => [{ value: 1 }],
          ),
        } as any,
        {
          ping: jest.fn(stalled === 'redis' ? never : async () => 'PONG'),
        } as any,
      );
      let report: Awaited<ReturnType<HealthService['check']>> | undefined;
      void service.check().then((value) => {
        report = value;
      });

      await jest.advanceTimersByTimeAsync(5_000);

      // The dependency deadline is 3s; the response must fit this 5s budget.
      expect(report).toEqual(
        expect.objectContaining({
          status: 'down',
          dependencies: {
            database: stalled === 'database' ? 'down' : 'up',
            redis: stalled === 'redis' ? 'down' : 'up',
          },
        }),
      );
    },
  );

  it('bounds both stalled dependencies to one 3-second wait and releases timers', async () => {
    jest.useFakeTimers();
    const never = () => new Promise<never>(() => undefined);
    const service = new HealthService(
      { $queryRaw: jest.fn(never) } as any,
      { ping: jest.fn(never) } as any,
    );
    let report: Awaited<ReturnType<HealthService['check']>> | undefined;
    void service.check().then(value => { report = value; });
    await jest.advanceTimersByTimeAsync(2_999);
    expect(report).toBeUndefined();
    await jest.advanceTimersByTimeAsync(1);
    expect(report).toMatchObject({
      status: 'down', dependencies: { database: 'down', redis: 'down' },
    });
    expect(jest.getTimerCount()).toBe(0);
  });

  it('clears deadline timers when dependencies respond promptly', async () => {
    jest.useFakeTimers();
    await expect(buildService(true, 'PONG').check()).resolves.toMatchObject({ status: 'up' });
    expect(jest.getTimerCount()).toBe(0);
  });

  const buildService = (
    dbOk: boolean,
    redisReply: string | Error,
  ): HealthService => {
    const prisma = {
      $queryRaw: dbOk
        ? jest.fn().mockResolvedValue([{ '?column?': 1 }])
        : jest.fn().mockRejectedValue(new Error('connection refused')),
    };
    const redis = {
      ping:
        redisReply instanceof Error
          ? jest.fn().mockRejectedValue(redisReply)
          : jest.fn().mockResolvedValue(redisReply),
    };

    return new HealthService(prisma as any, redis as any);
  };

  it('reports up when both dependencies answer', async () => {
    const report = await buildService(true, 'PONG').check();

    expect(report.status).toBe('up');
    expect(report.dependencies).toEqual({ database: 'up', redis: 'up' });
  });

  it('reports down when the database is unreachable', async () => {
    const report = await buildService(false, 'PONG').check();

    expect(report.status).toBe('down');
    expect(report.dependencies.database).toBe('down');
    expect(report.dependencies.redis).toBe('up');
  });

  it('reports down when redis is unreachable', async () => {
    const report = await buildService(true, new Error('ECONNREFUSED')).check();

    expect(report.status).toBe('down');
    expect(report.dependencies.redis).toBe('down');
  });

  it('does not throw when a dependency is down — it reports it', async () => {
    await expect(
      buildService(false, new Error('ECONNREFUSED')).check(),
    ).resolves.toMatchObject({ status: 'down' });
  });
});
