import { Users, UserCheck, Shield } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';
import { UserRole, UserStatus } from '@ats-platform/types';
import { IUserResponseDto } from '@/types/interfaces/user.interface';

interface UserStatsProps {
  users: IUserResponseDto[];
}

export function UserStats({ users }: UserStatsProps) {
  const activeCount = users.filter((u) => u.status === UserStatus.active).length;
  const adminCount = users.filter((u) => u.role === UserRole.admin).length;

  const stats = [
    {
      icon: <Users className="w-5 h-5 text-[#0071E3]" />,
      bg: '#E3F2FF',
      value: users.length,
      label: 'Tổng người dùng',
    },
    {
      icon: <UserCheck className="w-5 h-5 text-[#34C759]" />,
      bg: '#E8F5E9',
      value: activeCount,
      label: 'Đang hoạt động',
    },
    {
      icon: <Shield className="w-5 h-5 text-[#FF3B30]" />,
      bg: '#FFE5E5',
      value: adminCount,
      label: 'Quản trị viên',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-2xl p-5 border border-[#E5E5EA]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: stat.bg }}
            >
              {stat.icon}
            </div>
            <div>
              <p
                className="text-[24px] text-[#1D1D1F] tracking-[-0.01em]"
                style={{ fontFamily: SF, fontWeight: 700 }}
              >
                {stat.value}
              </p>
              <p className="text-[12px] text-[#6E6E73]">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
