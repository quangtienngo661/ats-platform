import { effectiveScreeningScores } from '@ats-platform/types';
import { Surface } from '@/components/ui';
import { IApplicationDto } from '@/types/interfaces/application.interface';

interface CandidatesStatsProps {
    applications: IApplicationDto[];
}

export function CandidatesStats({ applications }: CandidatesStatsProps) {
    const newCount = applications.filter(a => a.status === 'applied').length;
    const scores = applications
        .map(a => effectiveScreeningScores(a.screening ?? {}).overall)
        .filter((s): s is number => s != null && s > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const highScoreCount = scores.filter(s => s >= 90).length;

    const stats = [
        { label: 'Tổng ứng viên', value: applications.length },
        { label: 'Ứng viên mới', value: newCount },
        { label: 'Điểm AI trung bình', value: avgScore ?? 'Chưa có' },
        { label: 'Điểm AI từ 90', value: highScoreCount },
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
