import { Module } from '@nestjs/common';
import { AiConfigService } from './ai-config.service';
import { AiConfigController } from './ai-config.controller';

@Module({
  controllers: [AiConfigController],
  providers: [AiConfigService],
})
export class AiConfigModule {}
