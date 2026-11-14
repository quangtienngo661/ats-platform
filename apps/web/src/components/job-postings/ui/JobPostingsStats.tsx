import { Surface } from '@/components/ui';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';

interface JobPostingsStatsProps {
    jobs: IJobPostingDto[];
}

export function JobPostingsStats({ jobs }: JobPostingsStatsProps) {
    const stats = [
        { label: 'Tổng tin', value: jobs.length },
        { label: 'Đang tuyển', value: jobs.filter((j) => j.status === 'active').length },
        { label: 'Bản nháp', value: jobs.filter((j) => j.status === 'draft').length },
        { label: 'Đã đóng', value: jobs.filter((j) => j.status === 'closed').length },
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
