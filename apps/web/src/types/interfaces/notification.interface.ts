import { NotificationType, RelatedEntityType, IPaginatedResponse } from '@ats-platform/types';

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

export type IPaginatedNotifications = IPaginatedResponse<INotification>;
