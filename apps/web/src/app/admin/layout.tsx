import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export const metadata = {
  title: 'Quản trị | TalentAI',
  description: 'Khu vực quản trị hệ thống TalentAI',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
