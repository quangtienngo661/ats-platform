import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { cookies } from 'next/headers';

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
    } catch {}
  }

  return (
    <DashboardLayout userRole={userRole} userName={userName} userEmail={userEmail}>
      {children}
    </DashboardLayout>
  );
}
