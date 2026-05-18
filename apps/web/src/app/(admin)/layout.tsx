import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { cookies } from 'next/headers';
import { getNotificationsAction, getUnreadCountAction } from '@/servers/notifications/notifications.action';

export const metadata = {
  title: 'Quản trị | TalentAI',
  description: 'Khu vực quản trị hệ thống TalentAI',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  let userRole;
  if (token) {
    try {
      userRole = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).role;
    } catch {}
  }

  const [notifications, unreadCount] = token
    ? await Promise.all([
        getNotificationsAction(1, 20),
        getUnreadCountAction(),
      ])
    : [{ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }, 0];

  return (
    <DashboardLayout
      userRole={userRole}
      initialNotifications={notifications.data}
      initialUnreadCount={unreadCount}
    >
      {children}
    </DashboardLayout>
  );
}
