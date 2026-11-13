'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { StatusChip, Surface } from '@/components/ui';
import type { IApplicationHistoryItem } from '@/types/interfaces/application.interface';
import { ApplicationTimeline } from './timeline/ApplicationTimeline';
import { nextStepLabel } from './timeline/next-step';
import { WithdrawApplicationForm } from './ui/WithdrawApplicationForm';

/**
 * Only what the page shows. Props of a client component are serialized into the page,
 * so the full application (AI screening, CV, candidate row) must not be passed here.
 */
export interface ApplicationView {
    applicationId?: string;
    jobId?: string;
    title?: string;
    departmentName?: string;
    status: string;
    appliedAt?: string;
    history: IApplicationHistoryItem[];
}

/** One application of the candidate: the job it is for, its status and its timeline (D9). */
export function ApplicationDetail({ application }: { application: ApplicationView }) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const appliedOn = mounted && application.appliedAt
        ? new Date(application.appliedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : null;
    const next = nextStepLabel(application.status);
    const withdrawId = application.status === 'applied' ? application.applicationId : undefined;

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
            <Link
                href="/my-applications"
                className="mb-4 inline-flex items-center gap-1 text-body-sm text-ink-3 transition-colors duration-hover hover:text-ink"
            >
                <ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" />
                Đơn ứng tuyển
            </Link>

            <div className="mb-5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="break-words text-heading font-semibold text-ink">
                        {application.title ?? 'Đơn ứng tuyển'}
                    </h1>
                    {application.departmentName && (
                        <p className="mt-1 break-words text-body text-ink-3">{application.departmentName}</p>
                    )}
                </div>
                <StatusChip kind="candidate-application" value={application.status} className="mt-1" />
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
                <ApplicationTimeline
                    history={application.history}
                    status={application.status}
                    appliedAt={application.appliedAt}
                />

                <aside className="flex flex-col gap-4">
                    <Surface className="p-5">
                        <h2 className="text-title-sm font-semibold text-ink">Về đơn này</h2>
                        {appliedOn && <p className="mt-2 text-body-sm tabular-nums text-ink-2">Nộp ngày {appliedOn}</p>}
                        {next && <p className="mt-1 text-body-sm text-ink-2">Bước tiếp theo: {next}</p>}
                        {application.jobId && (
                            <Link
                                href={`/job-postings/${application.jobId}`}
                                className="mt-3 inline-flex items-center gap-1 text-body-sm font-medium text-accent-text hover:underline"
                            >
                                Xem tin tuyển dụng
                                <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden="true" />
                            </Link>
                        )}
                    </Surface>
                    {withdrawId && (
                        <Surface variant="inset" className="flex items-center justify-between gap-3 p-4">
                            <p className="text-body-sm text-ink-2">Không muốn ứng tuyển nữa?</p>
                            <WithdrawApplicationForm applicationId={withdrawId} onSuccess={() => router.refresh()} />
                        </Surface>
                    )}
                </aside>
            </div>
        </div>
    );
}
