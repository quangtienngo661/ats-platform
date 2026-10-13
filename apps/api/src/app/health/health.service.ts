import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../../common/prisma/prisma.service';

export type DependencyStatus = 'up' | 'down';

export interface HealthReport {
  status: DependencyStatus;
  uptimeSeconds: number;
  dependencies: {
    database: DependencyStatus;
    redis: DependencyStatus;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly dependencyTimeoutMs = 3_000;

  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  /**
   * Actually talks to both dependencies rather than reporting "up" because the
   * process is running — a health check that can't fail is worse than none, since
   * an orchestrator will happily keep routing traffic to a box whose DB is gone.
   */
  async check(): Promise<HealthReport> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    return {
      status: database === 'up' && redis === 'up' ? 'up' : 'down',
      uptimeSeconds: Math.floor(process.uptime()),
      dependencies: { database, redis },
    };
  }

  private async checkDatabase(): Promise<DependencyStatus> {
    try {
      await this.withDeadline(this.prisma.$queryRaw`SELECT 1`);
      return 'up';
    } catch (error) {
      this.logger.error(
        `Health check: database unreachable — ${error.message}`,
        error.stack,
      );
      return 'down';
    }
  }

  private async checkRedis(): Promise<DependencyStatus> {
    try {
      const pong = await this.withDeadline(this.redis.ping());
      return pong === 'PONG' ? 'up' : 'down';
    } catch (error) {
      this.logger.error(
        `Health check: redis unreachable — ${error.message}`,
        error.stack,
      );
      return 'down';
    }
  }

  private async withDeadline<T>(operation: PromiseLike<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        operation,
        new Promise<T>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Dependency did not respond within 3 seconds')),
            this.dependencyTimeoutMs,
          );
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
