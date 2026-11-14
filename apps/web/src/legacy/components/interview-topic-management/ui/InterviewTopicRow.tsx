import { Pencil } from 'lucide-react';
import { IInterviewTopic } from '@/types/interfaces/interview.interface';
import { DeleteInterviewTopicButton } from './DeleteInterviewTopicButton';

interface InterviewTopicRowProps {
    topic: IInterviewTopic;
    onEdit: (topic: IInterviewTopic) => void;
}

export function InterviewTopicRow({ topic, onEdit }: InterviewTopicRowProps) {
    const sessions = topic._count?.sessions ?? 0;

    return (
        <div className="grid grid-cols-[minmax(220px,1.5fr)_minmax(180px,1fr)_110px_120px] gap-4 border-b border-[#F2F2F7] px-4 py-3 text-[13px] last:border-b-0">
            <div className="min-w-0">
                <p className="truncate text-[#1D1D1F]" style={{ fontWeight: 600 }}>{topic.name}</p>
                <p className="mt-0.5 text-[11px] text-[#AEAEB2]">ID: {topic.topicId.slice(0, 8)}</p>
            </div>
            <div className="flex items-center text-[#6E6E73]">
                {topic.category?.name || 'Chưa phân loại'}
            </div>
            <div className="flex items-center text-[#6E6E73]">
                {sessions}
            </div>
            <div className="flex items-center justify-end gap-1.5">
                <button
                    type="button"
                    onClick={() => onEdit(topic)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#6E6E73] transition-colors hover:bg-[#EBF3FD] hover:text-[#0071E3]"
                    title="Chỉnh sửa"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <DeleteInterviewTopicButton topicId={topic.topicId} disabled={sessions > 0} />
            </div>
        </div>
    );
}