// src/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT', // Token để inject
      useFactory: (configService: ConfigService) => {
        const redisClient = new Redis({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          // password: configService.get<string>('REDIS_PASSWORD'),
          
          // Retry strategy (tùy chọn nhưng khuyên dùng)
          retryStrategy: (times) => {
            return Math.min(times * 50, 2000);
          },
        });

        redisClient.on('error', (err) => {
          console.error('Redis Client Error', err);
        });

        return redisClient;
      },
      inject: [ConfigService], // Inject ConfigService vào useFactory
    },
  ],
  exports: ['REDIS_CLIENT'], // Export token để các module khác dùng được
})
export class RedisModule {}