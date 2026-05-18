import type { ReactNode } from 'react';
import { PublicHeader } from '@/components/public/layout/PublicHeader';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeTokenPayload } from '@/lib/decodeTokenPayload';
import { getNotificationsAction, getUnreadCountAction } from '@/servers/notifications/notifications.action';

export const metadata = {
    title: 'TalentAI | Hồ sơ ứng viên',
    description: 'Quản lý hồ sơ, CV và đơn ứng tuyển của bạn.',
};

export default async function CandidateLayout({ children }: { children: ReactNode }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value || "";

    let userInfo: { fullName?: string; role?: string } | null = null;
    if (token) {
        try {
            const payload = decodeTokenPayload(token);
            if (payload) {
                userInfo = { fullName: payload.fullName, role: payload.role };
            }
        } catch { /* ignore */ }
    }

    // Redirect to login if not authenticated
    if (!userInfo) {
        redirect('/sign-in');
    }

    const [notifications, unreadCount] = await Promise.all([
        getNotificationsAction(1, 20),
        getUnreadCountAction(),
    ]);

    return (
        <div className="flex flex-col min-h-screen bg-[#F5F5F7]">
            <PublicHeader
                userInfo={userInfo}
                initialNotifications={notifications.data}
                initialUnreadCount={unreadCount}
            />
            <main className="flex flex-col flex-grow pt-[60px]">
                {children}
            </main>
        </div>
    );
}
