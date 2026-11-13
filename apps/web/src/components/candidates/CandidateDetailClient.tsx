'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import { Avatar, buttonClasses, StatusChip, Surface } from '@/components/ui';
import { IApplicationDto } from '@/types/interfaces/application.interface';
import { CandidateOverviewTab } from './ui/CandidateOverviewTab';
import { CandidateTabs } from './ui/CandidateTabs';
import { ScorecardPanel } from './ui/ScorecardPanel';
import { NotesPanel } from './ui/NotesPanel';
import { SERVER_URL } from '@/types/constants/urls';

interface CandidateDetailClientProps {
    application: IApplicationDto;
    jobId: string;
    currentUserId: string;
    isClosed: boolean;
}

type CandidateTab = 'overview' | 'evaluation' | 'notes';
const tabLabels: { id: CandidateTab; label: string }[] = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'evaluation', label: 'Đánh giá phỏng vấn' },
    { id: 'notes', label: 'Ghi chú' },
];

function parseTab(tab: string | null): CandidateTab {
    return tab === 'evaluation' || tab === 'notes' ? tab : 'overview';
}

export default function CandidateDetailClient({ application, jobId, currentUserId, isClosed }: CandidateDetailClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const queryTab = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState<CandidateTab>(() => parseTab(queryTab));

    useEffect(() => { setActiveTab(parseTab(queryTab)); }, [queryTab]);

    function changeTab(tab: CandidateTab) {
        setActiveTab(tab);
        const query = new URLSearchParams(searchParams.toString());
        if (tab === 'overview') query.delete('tab');
        else query.set('tab', tab);
        const suffix = query.toString();
        router.replace(`${pathname}${suffix ? `?${suffix}` : ''}`, { scroll: false });
    }

    const name = application.candidate?.user?.fullName || 'N/A';
    const email = application.candidate?.user?.email;
    const phone = application.candidate?.user?.phoneNumber;
    const linkDownload = `${SERVER_URL}/cvs/${application.cvId}/download?name=${name}`;
    const appliedAt = application.appliedAt ? new Date(application.appliedAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'N/A';

    const content: Record<CandidateTab, React.ReactNode> = {
        overview: <CandidateOverviewTab application={application} />,
        evaluation: <ScorecardPanel key={application.applicationId} applicationId={application.applicationId} currentUserId={currentUserId} isClosed={isClosed} />,
        notes: <NotesPanel key={application.applicationId} applicationId={application.applicationId} currentUserId={currentUserId} />,
    };

    return (
        <div className="space-y-4 py-4">
            <Link
                href={`/jobs/${jobId}/candidates`}
                className="inline-flex items-center gap-1.5 text-body-sm text-ink-3 transition-colors hover:text-ink"
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Quay lại danh sách
            </Link>

            <Surface className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 md:sticky md:top-14 md:z-sticky md:bg-surface/85 md:backdrop-blur">
                <Avatar name={name} size={40} />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h1 className="min-w-0 break-words text-heading text-ink">{name}</h1>
                        <StatusChip kind="application" value={application.status} />
                    </div>
                    <p className="mt-0.5 break-words text-body-sm text-ink-3">
                        {application.jobPosting?.title ? `${application.jobPosting.title} · ` : ''}Nộp ngày {appliedAt}
                    </p>
                    {(email || phone) && (
                        <p className="mt-0.5 flex flex-wrap gap-x-3 break-all text-body-sm text-ink-3">
                            {email && <span>{email}</span>}
                            {phone && <span>{phone}</span>}
                        </p>
                    )}
                </div>
                <div className="flex shrink-0 gap-2">
                    <a href={linkDownload} target="_blank" rel="noreferrer" download className={buttonClasses({ variant: 'secondary' })}>
                        <Download aria-hidden="true" />
                        Tải CV
                    </a>
                </div>
            </Surface>

            <CandidateTabs
                tabs={tabLabels.map((tab) => ({ ...tab, content: content[tab.id] }))}
                active={activeTab}
                onChange={changeTab}
            />
        </div>
    );
}
