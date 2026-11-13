import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageToolbar } from '@/components/ui';
import { ViewToggle } from './ViewToggle';

interface CandidatesHeaderProps {
    jobId: string;
    activeView: 'list' | 'kanban';
    /** The job's title when the page knows it; otherwise the page is named "Ứng viên". */
    title?: string;
}

export function CandidatesHeader({ jobId, activeView, title }: CandidatesHeaderProps) {
    return (
        <div className="space-y-1 px-4 pt-4 lg:px-6 lg:pt-6">
            <Link
                href="/jobs"
                className="inline-flex min-h-6 items-center gap-1.5 rounded-ctl text-caption text-ink-3 transition-colors duration-hover hover:text-ink"
            >
                <ArrowLeft aria-hidden="true" size={14} strokeWidth={1.75} />
                Quay lại tin tuyển dụng
            </Link>
            <PageToolbar title={title || 'Ứng viên'}>
                <ViewToggle jobId={jobId} activeView={activeView} />
            </PageToolbar>
        </div>
    );
}
