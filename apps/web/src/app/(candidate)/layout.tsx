import { getUiVariant } from '@/lib/ui-variant';
import { LegacyFrame } from '@/components/ui-variant/LegacyFrame';
import LegacyCandidateLayout from '@/legacy/app/(candidate)/layout';
import type { ReactNode } from 'react';
import { CandidateTabBar } from '@/components/shell/CandidateTabBar';
import { SiteHeader } from '@/components/shell/SiteHeader';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeTokenPayload } from '@/lib/decodeTokenPayload';
import { getNotificationsAction, getUnreadCountAction } from '@/servers/notifications/notifications.action';

export const metadata = {
    title: 'TalentAI | Hồ sơ ứng viên',
    description: 'Quản lý hồ sơ, CV và đơn ứng tuyển của bạn.',
};

export default async function CandidateLayout({ children }: { children: ReactNode }) {
  if ((await getUiVariant()) === 'legacy') {
    return (
      <LegacyFrame>
        <LegacyCandidateLayout>{children}</LegacyCandidateLayout>
      </LegacyFrame>
    );
  }

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
        <div className="flex min-h-dvh flex-col bg-canvas">
            <SiteHeader
                userInfo={userInfo}
                initialNotifications={notifications.items}
                initialUnreadCount={unreadCount}
            />
            <main id="main-content" className="flex flex-1 flex-col">
                {children}
            </main>
            {userInfo.role === 'candidate' ? <CandidateTabBar /> : null}
        </div>
    );
}
