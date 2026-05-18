import { IInterviewTopic } from '@/types/interfaces/interview.interface';
import { InterviewTopicRow } from './InterviewTopicRow';

interface InterviewTopicTableProps {
    topics: IInterviewTopic[];
    onEdit: (topic: IInterviewTopic) => void;
}

export function InterviewTopicTable({ topics, onEdit }: InterviewTopicTableProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-[#E5E5EA] bg-white">
            <div className="grid grid-cols-[minmax(220px,1.5fr)_minmax(180px,1fr)_110px_120px] gap-4 border-b border-[#F2F2F7] bg-[#F5F5F7] px-4 py-3 text-[11px] uppercase tracking-[0.06em] text-[#6E6E73]" style={{ fontWeight: 700 }}>
                <span>Chủ đề</span>
                <span>Danh mục</span>
                <span>Phiên</span>
                <span className="text-right">Thao tác</span>
            </div>

            {topics.length > 0 ? (
                topics.map((topic) => (
                    <InterviewTopicRow key={topic.topicId} topic={topic} onEdit={onEdit} />
                ))
            ) : (
                <div className="px-4 py-10 text-center text-[13px] text-[#6E6E73]">
                    Không tìm thấy chủ đề phỏng vấn phù hợp.
                </div>
            )}
        </div>
    );
}