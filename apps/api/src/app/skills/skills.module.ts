import { Module } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { VectorModule } from '../../common/vector/vector.module';

@Module({
  imports: [PrismaModule, VectorModule],
  controllers: [SkillsController],
  providers: [SkillsService],
})
export class SkillsModule {}
