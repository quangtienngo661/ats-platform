import { HealthService } from './health.service';

describe('HealthService', () => {
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
