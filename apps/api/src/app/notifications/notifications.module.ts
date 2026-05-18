import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { SocketIoModule } from '../../common/socket-io/socket-io.module';

@Module({
    imports: [PrismaModule, SocketIoModule],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule {}
