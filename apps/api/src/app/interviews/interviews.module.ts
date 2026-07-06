import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';
import { InterviewSessionService } from './session/interview-session.service';
import { InterviewGateway } from './session/interview.gateway';
import { InterviewProcessor } from './session/interview.processor';
import { InterviewGenerationProcessor } from './session/interview-generation.processor';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { GeminiModule } from '../../common/external-apis/gemini/gemini.module';
import { SocketIoModule } from '../../common/socket-io/socket-io.module';

@Module({
    imports: [
        PrismaModule,
        GeminiModule,
        SocketIoModule,
        BullModule.registerQueue(
            { name: 'interview-evaluation' },
            { name: 'interview-generation' },
        ),
    ],
    controllers: [InterviewsController],
    providers: [
        InterviewsService,
        InterviewSessionService,
        InterviewGateway,
        InterviewProcessor,
        InterviewGenerationProcessor,
    ],
    exports: [InterviewsService, InterviewSessionService],
})
export class InterviewsModule {}
