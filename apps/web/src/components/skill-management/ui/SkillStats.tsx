import { Surface } from '@/components/ui';
import { ISkillDto } from '@/types/interfaces/skill.interface';

interface SkillStatsProps {
    skills: ISkillDto[];
}

export function SkillStats({ skills }: SkillStatsProps) {
    const uniqueCategories = new Set(skills.map((s) => s.category).filter(Boolean)).size;
    const uncategorized = skills.filter((s) => !s.category).length;

    const stats = [
        { label: 'Tổng kỹ năng', value: skills.length },
        { label: 'Danh mục', value: uniqueCategories },
        { label: 'Chưa phân loại', value: uncategorized },
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
