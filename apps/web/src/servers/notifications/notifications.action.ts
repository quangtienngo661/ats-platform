'use server';

import http from '@/lib/http';
import { IPaginatedNotifications } from '@/types/interfaces/notification.interface';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosErr = error as { response?: { data?: { message?: string | string[] } } };
        const msg = axiosErr.response?.data?.message;
        if (msg) return Array.isArray(msg) ? msg[0] : msg;
    }
    return fallback;
}

// ─── Server Actions ───────────────────────────────────────────────────────────

export async function getNotificationsAction(
    page = 1,
    limit = 20,
    isRead?: boolean,
): Promise<IPaginatedNotifications> {
    try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (isRead !== undefined) params.set('isRead', String(isRead));

        const response = await http.get(`/notifications?${params.toString()}`);
        console.log(response.data);
        return response.data as IPaginatedNotifications;
    } catch {
        return { items: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };
    }
}

export async function getUnreadCountAction(): Promise<number> {
    try {
        const response = await http.get('/notifications/unread-count');
        const data = response.data as { unreadCount: number };
        return data.unreadCount;
    } catch {
        return 0;
    }
}
export async function markAsReadAction(notificationId: string): Promise<{ success: boolean; message: string }> {
    try {
        await http.patch(`/notifications/${notificationId}/read`);
        return { success: true, message: 'Đã đánh dấu đã đọc' };
    } catch (error) {
        return { success: false, message: extractMessage(error, 'Không thể đánh dấu đã đọc') };
    }
}
export async function markAllAsReadAction(): Promise<{ success: boolean; message: string }> {
    try {
        await http.patch('/notifications/read-all');
        return { success: true, message: 'Đã đánh dấu tất cả đã đọc' };
    } catch (error) {
        return { success: false, message: extractMessage(error, 'Không thể đánh dấu đã đọc') };
    }
}
export async function deleteNotificationAction(notificationId: string): Promise<{ success: boolean; message: string }> {
    try {
        await http.delete(`/notifications/${notificationId}`);
        return { success: true, message: 'Đã xóa thông báo' };
    } catch (error) {
        return { success: false, message: extractMessage(error, 'Không thể xóa thông báo') };
    }
}
