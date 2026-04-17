import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { cookies } from 'next/headers';

export const metadata = {
  title: 'HR Portal | TalentAI',
  description: 'Quản lý tuyển dụng TalentAI',
};

export default async function HRRouteLayout({ children }: { children: React.ReactNode }) {
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
