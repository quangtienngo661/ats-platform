import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export const metadata = {
  title: 'HR Portal | TalentAI',
  description: 'Quản lý tuyển dụng TalentAI',
};

export default function HRRouteLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
