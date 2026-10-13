import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { getMeAction } from '@/servers/users/users.action';
import { getCurrentOrganizationAction } from '@/servers/organizations/organizations.action';
import { cookies } from 'next/headers';
import { getNotificationsAction, getUnreadCountAction } from '@/servers/notifications/notifications.action';

export const metadata = {
  title: 'HR Portal | TalentAI',
  description: 'Quản lý tuyển dụng TalentAI',
};

export default async function HRRouteLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  let userRole: string | undefined;
  let userName: string | undefined;
  let userEmail: string | undefined;
  if (token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userRole = payload.role;
      userName = payload.fullName;
      userEmail = payload.email;
    } catch {
      // ignore token parse errors
    }

  }
  const me = token ? await getMeAction() : null;
  if (me) { userRole = me.role; userName = me.fullName; userEmail = me.email; }
  const organization = me && (me.role === 'org_admin' || me.role === 'recruiter') ? await getCurrentOrganizationAction() : null;
  const [notifications, unreadCount] = token
    ? await Promise.all([
        getNotificationsAction(1, 20),
        getUnreadCountAction(),
      ])
    : [{ items: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } }, 0];

  return (
    <DashboardLayout
      userRole={userRole}
      userName={userName}
      userEmail={userEmail}
      organizationName={organization?.name}
      initialNotifications={notifications.items}
      initialUnreadCount={unreadCount}
    >
      {children}
    </DashboardLayout>
  );
}
