import { Surface } from '@/components/ui';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';

interface RecruiterStatsProps {
    recruiters: IRecruiterDto[];
}

export function RecruiterStats({ recruiters }: RecruiterStatsProps) {
    const stats = [
        { label: 'Tổng số', value: recruiters.length },
        { label: 'Đang hoạt động', value: recruiters.filter((r) => r.user?.status === 'active').length },
        {
            label: 'Phòng ban',
            value: new Set(recruiters.map((r) => r.department?.departmentId).filter(Boolean)).size,
        },
        { label: 'Có chức vụ', value: recruiters.filter((r) => !!r.position).length },
    ];

    return (
        <Surface as="dl" className="grid grid-cols-1 divide-y divide-line sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {stats.map(({ label, value }) => (
                <div key={label} className="flex items-baseline justify-between gap-3 px-4 py-2.5 sm:block sm:py-3">
                    <dt className="text-caption text-ink-3">{label}</dt>
                    <dd className="text-title-sm tabular-nums text-ink sm:mt-0.5">{value}</dd>
                </div>
            ))}
        </Surface>
    );
}
