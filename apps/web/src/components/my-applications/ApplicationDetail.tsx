'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import type { IApplicationHistoryItem } from '@/types/interfaces/application.interface';
import { STATUS_CONFIG } from './status-config';
import { ApplicationTimeline } from './timeline/ApplicationTimeline';

/**
 * Only what the page shows. Props of a client component are serialized into the page,
 * so the full application (AI screening, CV, candidate row) must not be passed here.
 */
export interface ApplicationView {
    title?: string;
    departmentName?: string;
    status: string;
    appliedAt?: string;
    history: IApplicationHistoryItem[];
}

/** One application of the candidate: the job it is for, its status and its timeline (D9). */
export function ApplicationDetail({ application }: { application: ApplicationView }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const status = STATUS_CONFIG[application.status] ?? { label: application.status, color: '#6E6E73', bg: '#F5F5F7' };
    const appliedOn = mounted && application.appliedAt
        ? new Date(application.appliedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : null;

    return (
        <div className="w-full max-w-[900px] mx-auto px-4 md:px-6 py-8" style={{ fontFamily: SFT }}>
            <Link
                href="/my-applications"
                className="inline-flex items-center gap-1 mb-4 text-[12px] text-[#6E6E73] hover:text-[#1D1D1F]"
                style={{ fontWeight: 500 }}
            >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                Đơn ứng tuyển
            </Link>

            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 mb-4">
                <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <h1
                            className="text-[20px] text-[#1D1D1F] tracking-[-0.01em] break-words"
                            style={{ fontFamily: SF, fontWeight: 700 }}
                        >
                            {application.title ?? 'Đơn ứng tuyển'}
                        </h1>
                        {application.departmentName && (
                            <p className="text-[13px] text-[#6E6E73] mt-0.5">{application.departmentName}</p>
                        )}
                        {appliedOn && <p className="text-[12px] text-[#AEAEB2] mt-1.5">Nộp ngày {appliedOn}</p>}
                    </div>
                    <span
                        className="text-[11px] rounded-full px-2.5 py-1 flex-shrink-0 inline-flex items-center gap-1"
                        style={{ background: status.bg, color: status.color, fontWeight: 600 }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
                        {status.label}
                    </span>
                </div>
            </div>

            <ApplicationTimeline
                history={application.history}
                status={application.status}
                appliedAt={application.appliedAt}
            />
        </div>
    );
}
