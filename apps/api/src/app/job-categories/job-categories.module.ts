import { Module } from '@nestjs/common';
import { JobCategoriesService } from './job-categories.service';
import { JobCategoriesController } from './job-categories.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [JobCategoriesController],
  providers: [JobCategoriesService],
})
export class JobCategoriesModule {}
