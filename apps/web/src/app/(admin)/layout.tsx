import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { cookies } from 'next/headers';

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

  return <DashboardLayout userRole={userRole}>{children}</DashboardLayout>;
}
