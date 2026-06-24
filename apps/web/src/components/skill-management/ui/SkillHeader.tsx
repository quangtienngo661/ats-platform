import { Zap, Plus } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';

interface SkillHeaderProps {
    onAdd: () => void;
}

export function SkillHeader({ onAdd }: SkillHeaderProps) {
    return (
        <div className="mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6366F1] flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1
                            className="text-[24px] text-[#1D1D1F] tracking-[-0.02em]"
                            style={{ fontFamily: SF, fontWeight: 700 }}
                        >
                            Quản lý kỹ năng
                        </h1>
                        <p className="text-[13px] text-[#6E6E73]" style={{ fontFamily: SFT }}>
                            Kho kỹ năng dùng cho JD và AI screening
                        </p>
                    </div>
                </div>

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
