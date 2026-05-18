import { NotificationType, RelatedEntityType } from '@ats-platform/database';

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION
// ═══════════════════════════════════════════════════════════════

export interface INotification {
    notificationId: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    relatedEntityId: string | null;
    relatedEntityType: RelatedEntityType | null;
    createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// PAGINATED NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

export interface IPaginatedNotifications {
    data: INotification[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
