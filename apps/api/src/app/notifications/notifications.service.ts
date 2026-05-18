import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { SocketIoService } from '../../common/socket-io/socket-io.service';

@Injectable()
export class NotificationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly socketIoService: SocketIoService,
    ) {}

    async create(dto: CreateNotificationDto) {
        const notification = await this.prisma.notification.create({
            data: {
                userId: dto.userId,
                type: dto.type,
                title: dto.title,
                message: dto.message,
                relatedEntityId: dto.relatedEntityId,
                relatedEntityType: dto.relatedEntityType,
            },
        });

        this.socketIoService.handleEmit('notification:new', notification, `user_${notification.userId}`);

        return notification;
    }
    async findAll(userId: string, query: GetNotificationsQueryDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const where: any = { userId };
        if (query.isRead !== undefined) {
            where.isRead = query.isRead;
        }

        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.notification.count({ where }),
        ]);

        return {
            data: notifications,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getUnreadCount(userId: string) {
        const count = await this.prisma.notification.count({
            where: { userId, isRead: false },
        });
        return { unreadCount: count };
    }
    async markAsRead(notificationId: string, userId: string) {
        const notification = await this.prisma.notification.findUnique({
            where: { notificationId },
        });

        if (!notification) throw new NotFoundException('Không tìm thấy thông báo');
        if (notification.userId !== userId) throw new NotFoundException('Không tìm thấy thông báo');

        return this.prisma.notification.update({
            where: { notificationId },
            data: { isRead: true },
        });
    }
    async markAllAsRead(userId: string) {
        const result = await this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return { updatedCount: result.count };
    }
    async remove(notificationId: string, userId: string) {
        const notification = await this.prisma.notification.findUnique({
            where: { notificationId },
        });

        if (!notification) throw new NotFoundException('Không tìm thấy thông báo');
        if (notification.userId !== userId) throw new NotFoundException('Không tìm thấy thông báo');

        return this.prisma.notification.delete({
            where: { notificationId },
        });
    }
}
