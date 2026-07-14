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
      await this.prisma.$queryRaw`SELECT 1`;
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
      const pong = await this.redis.ping();
      return pong === 'PONG' ? 'up' : 'down';
    } catch (error) {
      this.logger.error(
        `Health check: redis unreachable — ${error.message}`,
        error.stack,
      );
      return 'down';
    }
  }
}
