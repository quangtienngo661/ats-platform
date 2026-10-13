import { Plus } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';

interface SkillHeaderProps {
    onAdd: () => void;
}

export function SkillHeader({ onAdd }: SkillHeaderProps) {
    return (
        <div className="mb-6">
            <div className="flex items-center justify-end">
                <h1 className="sr-only">Quản lý kỹ năng</h1>

                <button
                    onClick={onAdd}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#6366F1] hover:bg-[#4F52D9] text-white rounded-xl transition-all shadow-sm text-[13px]"
                    style={{ fontWeight: 500, fontFamily: SF }}
                >
                    <Plus className="w-4 h-4" />
                    Thêm kỹ năng
                </button>
            </div>
        </div>
    );
}
