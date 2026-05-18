import { Plus, ClipboardList } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';

interface InterviewTopicHeaderProps {
    onAdd: () => void;
}

export function InterviewTopicHeader({ onAdd }: InterviewTopicHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EBF3FD] flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-[#0071E3]" />
                </div>
                <div>
                    <h1 className="text-[22px] text-[#1D1D1F] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                        Chủ đề phỏng vấn
                    </h1>
                    <p className="text-[13px] text-[#6E6E73]">Quản lý bộ chủ đề dùng cho phỏng vấn AI</p>
                </div>
            </div>

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