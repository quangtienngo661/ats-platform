import { Surface } from '@/components/ui';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';

interface JobCategoryStatsProps {
    categories: IJobCategoryDto[];
}

export function JobCategoryStats({ categories }: JobCategoryStatsProps) {
    const totalChildren = categories.reduce((sum, c) => sum + (c.childCategories?.length || 0), 0);
    const totalJobPostings = categories.reduce((sum, c) => sum + (c.jobPostings?.length || 0), 0);

    const stats = [
        { label: 'Danh mục gốc', value: categories.length },
        { label: 'Danh mục con', value: totalChildren },
        { label: 'Tin tuyển dụng', value: totalJobPostings },
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
