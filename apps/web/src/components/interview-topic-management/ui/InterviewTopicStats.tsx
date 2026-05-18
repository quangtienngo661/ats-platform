import { IInterviewTopic } from '@/types/interfaces/interview.interface';

interface InterviewTopicStatsProps {
    topics: IInterviewTopic[];
}

export function InterviewTopicStats({ topics }: InterviewTopicStatsProps) {
    const totalSessions = topics.reduce((sum, topic) => sum + (topic._count?.sessions ?? 0), 0);
    const categories = new Set(topics.map((topic) => topic.categoryId).filter(Boolean));
    const activeTopics = topics.filter((topic) => (topic._count?.sessions ?? 0) > 0).length;

    const stats = [
        { label: 'Tổng chủ đề', value: topics.length, bg: '#EBF3FD', color: '#0071E3' },
        { label: 'Danh mục', value: categories.size, bg: '#F0FDF4', color: '#16A34A' },
        { label: 'Đã sử dụng', value: activeTopics, bg: '#FFFBEB', color: '#D97706' },
        { label: 'Phiên phỏng vấn', value: totalSessions, bg: '#F5F3FF', color: '#7C3AED' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {stats.map((item) => (
                <div key={item.label} className="rounded-xl border border-[#E5E5EA] bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: item.bg }}>
                            <span className="text-[15px]" style={{ color: item.color, fontWeight: 700 }}>{item.value}</span>
                        </div>
                        <span className="text-[12px] text-[#6E6E73]">{item.label}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}