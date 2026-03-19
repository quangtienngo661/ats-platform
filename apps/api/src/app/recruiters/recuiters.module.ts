import { Module } from '@nestjs/common';
import { RecuitersService } from './recuiters.service';
import { RecuitersController } from './recuiters.controller';

@Module({
  controllers: [RecuitersController],
  providers: [RecuitersService],
})
export class RecuitersModule {}
