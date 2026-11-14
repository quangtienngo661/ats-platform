import { Surface } from '@/components/ui';
import { IInterviewTopic } from '@/types/interfaces/interview.interface';

interface InterviewTopicStatsProps {
    topics: IInterviewTopic[];
}

export function InterviewTopicStats({ topics }: InterviewTopicStatsProps) {
    const totalSessions = topics.reduce((sum, topic) => sum + (topic._count?.sessions ?? 0), 0);
    const categories = new Set(topics.map((topic) => topic.categoryId).filter(Boolean));
    const activeTopics = topics.filter((topic) => (topic._count?.sessions ?? 0) > 0).length;

    const stats = [
        { label: 'Tổng chủ đề', value: topics.length },
        { label: 'Danh mục', value: categories.size },
        { label: 'Đã sử dụng', value: activeTopics },
        { label: 'Phiên phỏng vấn', value: totalSessions },
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
