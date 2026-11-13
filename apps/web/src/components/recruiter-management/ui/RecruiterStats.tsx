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
        <Surface as="dl" className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
            {stats.map(({ label, value }) => (
                <div key={label} className="flex items-baseline justify-between gap-3 px-4 py-3 sm:block">
                    <dt className="text-caption text-ink-3">{label}</dt>
                    <dd className="text-title-sm tabular-nums text-ink sm:mt-0.5">{value}</dd>
                </div>
            ))}
        </Surface>
    );
}
