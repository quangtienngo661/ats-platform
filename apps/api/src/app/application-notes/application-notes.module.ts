import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ApplicationsModule } from '../applications/applications.module';
import { ApplicationNotesController } from './application-notes.controller';
import { ApplicationNotesService } from './application-notes.service';

@Module({
  imports: [PrismaModule, ApplicationsModule],
  controllers: [ApplicationNotesController],
  providers: [ApplicationNotesService],
})
export class ApplicationNotesModule {}
