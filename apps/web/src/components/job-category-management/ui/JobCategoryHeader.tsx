import { Plus } from 'lucide-react';

interface JobCategoryHeaderProps {
    onAdd: () => void;
}

export function JobCategoryHeader({ onAdd }: JobCategoryHeaderProps) {
    return (
        <div className="mb-6">
            <div className="flex items-center justify-end">
                <h1 className="sr-only">Danh mục ngành nghề</h1>

                <button
                    onClick={onAdd}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#6366F1] hover:bg-[#5558E6] text-white rounded-xl transition shadow-sm text-[13px]"
                    style={{ fontWeight: 500 }}
                >
                    <Plus className="w-4 h-4" />
                    Thêm danh mục
                </button>
            </div>
        </div>
    );
}
