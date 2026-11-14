import { Surface } from '@/components/ui';
import { Department } from '@/types/interfaces/departments.interface';

interface DepartmentStatsProps {
    departments: Department[];
}

export function DepartmentStats({ departments }: DepartmentStatsProps) {
    const totalMembers = departments.reduce((sum, d) => sum + d.membersCount, 0);
    const avgMembers = Math.round(totalMembers / departments.length) || 0;

    const stats = [
        { label: 'Phòng ban', value: departments.length },
        { label: 'Nhân viên', value: totalMembers },
        { label: 'Trung bình / phòng ban', value: avgMembers },
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
