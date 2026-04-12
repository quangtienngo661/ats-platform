import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AiUsageLogsService } from '../ai-usage-logs/ai-usage-logs.service';
import { CvScreeningsModule } from '../cv-screenings/cv-screenings.module';

@Module({
    imports: [PrismaModule, CvScreeningsModule],
    controllers: [ApplicationsController],
    providers: [ApplicationsService, AiUsageLogsService],
    exports: [ApplicationsService],
})
export class ApplicationsModule { }
