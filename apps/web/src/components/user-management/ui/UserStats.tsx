import { UserRole, UserStatus } from '@ats-platform/types';
import { Surface } from '@/components/ui';
import { IUserResponseDto } from '@/types/interfaces/user.interface';

interface UserStatsProps {
  users: IUserResponseDto[];
}

export function UserStats({ users }: UserStatsProps) {
  const stats = [
    { label: 'Tổng người dùng', value: users.length },
    { label: 'Đang hoạt động', value: users.filter((u) => u.status === UserStatus.active).length },
    { label: 'Quản trị viên', value: users.filter((u) => u.role === UserRole.admin).length },
  ];

  return (
    <Surface as="dl" className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {stats.map(({ label, value }) => (
        <div key={label} className="flex items-baseline justify-between gap-3 px-4 py-2.5 sm:block sm:py-3">
          <dt className="text-caption text-ink-3">{label}</dt>
          <dd className="text-title-sm tabular-nums text-ink sm:mt-0.5">{value}</dd>
        </div>
      ))}
    </Surface>
  );
}
