import Link from 'next/link';
import { List, LayoutGrid } from 'lucide-react';
import { SFT } from '@/types/fonts/fonts';

interface ViewToggleProps {
    jobId: string;
    activeView: 'list' | 'kanban';
}

export function ViewToggle({ jobId, activeView }: ViewToggleProps) {
    return (
        <div className="flex items-center gap-1 bg-[#F5F5F7] p-1 rounded-xl w-fit" style={{ fontFamily: SFT }}>
            <Link
                href={`/jobs/${jobId}/candidates`}
                className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] transition-all ${
                    activeView === 'list'
                        ? 'bg-white text-[#1D1D1F] shadow-sm'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
                style={{ fontWeight: activeView === 'list' ? 500 : 400 }}
            >
                <List className="w-3.5 h-3.5" />
                Danh sách
            </Link>
            <Link
                href={`/jobs/${jobId}/kanban`}
                className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] transition-all ${
                    activeView === 'kanban'
                        ? 'bg-white text-[#1D1D1F] shadow-sm'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
                style={{ fontWeight: activeView === 'kanban' ? 500 : 400 }}
            >
                <LayoutGrid className="w-3.5 h-3.5" />
                Kanban
            </Link>
        </div>
    );
}
