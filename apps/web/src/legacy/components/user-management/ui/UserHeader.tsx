import { Plus } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';

interface UserHeaderProps {
    onAdd: () => void;
}

export function UserHeader({ onAdd }: UserHeaderProps) {
    return (
        <div className="mb-6">
            <div className="flex items-center justify-end">
                <h1 className="sr-only">Quản lý người dùng</h1>

                <button
                    onClick={onAdd}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl transition shadow-sm text-[13px]"
                    style={{ fontWeight: 500, fontFamily: SF }}
                >
                    <Plus className="w-4 h-4" />
                    Thêm người dùng
                </button>
            </div>
        </div>
    );
}
