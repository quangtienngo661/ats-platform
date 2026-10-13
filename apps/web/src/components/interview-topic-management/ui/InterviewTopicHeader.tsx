import { Plus } from 'lucide-react';

interface InterviewTopicHeaderProps {
    onAdd: () => void;
}

export function InterviewTopicHeader({ onAdd }: InterviewTopicHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end mb-6">
            <h1 className="sr-only">Chủ đề phỏng vấn</h1>

            <button
                type="button"
                onClick={onAdd}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0071E3] px-4 py-2.5 text-[13px] text-white shadow-sm transition-colors hover:bg-[#0077ED]"
                style={{ fontWeight: 600 }}
            >
                <Plus className="w-4 h-4" />
                Thêm chủ đề
            </button>
        </div>
    );
}