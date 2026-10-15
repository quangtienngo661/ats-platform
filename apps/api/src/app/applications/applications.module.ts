import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { BulkScreeningService } from './bulk-screening.service';
import { ApplicationExportService } from './application-export.service';
import { ApplicationComparisonService } from './application-comparison.service';
import { ApplicationsController } from './applications.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AiUsageLogsService } from '../ai-usage-logs/ai-usage-logs.service';
import { CvScreeningsModule } from '../cv-screenings/cv-screenings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CandidateNotificationsModule } from '../candidate-notifications/candidate-notifications.module';

@Module({
    imports: [
        PrismaModule,
        CvScreeningsModule,
        NotificationsModule,
        CandidateNotificationsModule,
    ],
    controllers: [ApplicationsController],
    providers: [ApplicationsService, BulkScreeningService, ApplicationExportService, ApplicationComparisonService, AiUsageLogsService],
    exports: [ApplicationsService],
})
export class ApplicationsModule { }
