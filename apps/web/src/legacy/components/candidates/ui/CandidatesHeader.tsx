import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SFT } from '@/types/fonts/fonts';
import { ViewToggle } from './ViewToggle';

interface CandidatesHeaderProps {
    jobId: string;
    activeView: 'list' | 'kanban';
}

export function CandidatesHeader({ jobId, activeView }: CandidatesHeaderProps) {
    return (
        <div className="px-6 pt-2 pb-0 lg:px-8 flex items-center justify-between">
            <Link
                href="/jobs"
                className="inline-flex items-center gap-2 text-[14px] text-[#1D1D1F] hover:text-[#0071E3] transition-colors"
                style={{ fontFamily: SFT, fontWeight: 500 }}
            >
                <ArrowLeft className="w-4 h-4" />
                Quay lại tin tuyển dụng
            </Link>

            <ViewToggle jobId={jobId} activeView={activeView} />
        </div>
    );
}
