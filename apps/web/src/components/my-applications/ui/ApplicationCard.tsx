import Link from 'next/link';
import { MapPin, CalendarClock, ArrowRight } from 'lucide-react';
import { IApplicationCard } from '@/types/interfaces/application.interface';
import { StatusChip } from '@/components/ui';
import { WithdrawApplicationForm } from './WithdrawApplicationForm';
import { nextStepLabel } from '../timeline/next-step';
import { WORK_TYPE_LABELS, type WorkType } from '@/lib/work-types';

interface ApplicationCardProps {
    application: IApplicationCard;
    onWithdrawSuccess: (applicationId: string) => void;
}

function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export function ApplicationCard({ application: app, onWithdrawSuccess }: ApplicationCardProps) {
    const canWithdraw = app.status === 'applied';
    const next = nextStepLabel(app.status);

    return (
        <div className="relative rounded-card bg-surface p-4 shadow-e1 transition duration-hover ease-out-expo hover:-translate-y-0.5 hover:shadow-e3 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="break-words text-title-sm font-medium text-ink">{app.jobTitle ?? '-'}</p>
                    <p className="mt-0.5 break-words text-body-sm text-ink-3">{app.departmentName ?? '-'}</p>
                </div>
                <StatusChip kind="candidate-application" value={app.status} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-ink-3">
                {app.locationType && (
                    <span className="inline-flex items-center gap-1">
                        <MapPin size={14} strokeWidth={1.75} aria-hidden="true" />
                        {WORK_TYPE_LABELS[app.locationType as WorkType] || app.locationType}
                    </span>
                )}
                <span className="tabular-nums">Nộp {formatDate(app.appliedAt)}</span>
                {app.aiScore != null && <span className="tabular-nums">AI Score: {app.aiScore}%</span>}
            </div>

            {next && <p className="mt-3 text-body-sm text-ink-2">Bước tiếp theo: {next}</p>}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {/* The stretched pseudo-element makes the whole card open the timeline; later siblings sit above it. */}
                    <Link
                        href={`/my-applications/${app.applicationId}`}
                        className="inline-flex items-center gap-1 text-body-sm font-medium text-accent-text after:absolute after:inset-0 after:rounded-card hover:underline"
                    >
                        Xem tiến trình
                        <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                    {app.status === 'interview' && (
                        <Link
                            href="/my-interviews"
                            className="relative inline-flex items-center gap-1 text-body-sm font-medium text-accent-text hover:underline"
                        >
                            <CalendarClock size={14} strokeWidth={1.75} aria-hidden="true" />
                            Xem lịch phỏng vấn
                        </Link>
                    )}
                </div>
                {canWithdraw && (
                    <div className="relative">
                        <WithdrawApplicationForm applicationId={app.applicationId} onSuccess={onWithdrawSuccess} />
                    </div>
                )}
            </div>
        </div>
    );
}
