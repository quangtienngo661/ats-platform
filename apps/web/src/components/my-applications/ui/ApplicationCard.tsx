import Link from 'next/link';
import { MapPin, Briefcase, Star, CalendarClock, ListChecks } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';
import { IApplicationCard } from '@/types/interfaces/application.interface';
import { WithdrawApplicationForm } from './WithdrawApplicationForm';
import { STATUS_CONFIG } from '../status-config';
import { WORK_TYPE_LABELS, type WorkType } from '@/lib/work-types';

interface ApplicationCardProps {
    application: IApplicationCard;
    onWithdrawSuccess: (applicationId: string) => void;
}

const PIPELINE_STEPS = ['applied', 'screening', 'interview', 'offer', 'hired'] as const;
const ACTIVE_STATUSES = new Set(PIPELINE_STEPS as readonly string[]);

function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function PipelineProgress({ status }: { status: string }) {
    if (!ACTIVE_STATUSES.has(status)) return null;

    const currentIdx = PIPELINE_STEPS.indexOf(status as typeof PIPELINE_STEPS[number]);

    return (
        <div className="flex items-center gap-1 mt-3">
            {PIPELINE_STEPS.map((step, index) => (
                <div key={step} className="flex items-center gap-1 flex-1">
                    <div
                        className="h-1.5 rounded-full flex-1 transition-colors"
                        style={{
                            background: index <= currentIdx
                                ? STATUS_CONFIG[step]?.color ?? '#0071E3'
                                : '#E5E5EA',
                        }}
                    />
                </div>
            ))}
        </div>
    );
}

export function ApplicationCard({ application: app, onWithdrawSuccess }: ApplicationCardProps) {
    const status = STATUS_CONFIG[app.status] ?? { label: app.status, color: '#6E6E73', bg: '#F5F5F7' };
    const canWithdraw = app.status === 'applied';

    return (
        <div className="group bg-white rounded-2xl border border-[#E5E5EA] p-5 hover:shadow-md hover:shadow-black/5 transition">
            <div className="flex items-start gap-4">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: status.bg }}
                >
                    <Briefcase className="w-5 h-5" style={{ color: status.color }} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-1">
                        <div className="min-w-0">
                            <p
                                className="text-[15px] text-[#1D1D1F] truncate"
                                style={{ fontFamily: SF, fontWeight: 600 }}
                            >
                                {app.jobTitle ?? '-'}
                            </p>
                            <p className="text-[12px] text-[#6E6E73] mt-0.5">
                                {app.departmentName ?? '-'}
                            </p>
                        </div>

                        <span
                            className="text-[10px] rounded-full px-2.5 py-1 flex-shrink-0 inline-flex items-center gap-1"
                            style={{ background: status.bg, color: status.color, fontWeight: 600 }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
                            {status.label}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 text-[12px] text-[#AEAEB2] mt-1.5 flex-wrap">
                        {app.locationType && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {WORK_TYPE_LABELS[app.locationType as WorkType] || app.locationType}
                            </span>
                        )}
                        <span>Nộp {formatDate(app.appliedAt)}</span>
                        {app.aiScore != null && (
                            <span className="flex items-center gap-1 text-[#F59E0B]">
                                <Star className="w-3 h-3" />
                                AI Score: {app.aiScore}%
                            </span>
                        )}
                    </div>

                    <PipelineProgress status={app.status} />

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                        <Link
                            href={`/my-applications/${app.applicationId}`}
                            className="inline-flex items-center gap-1 text-[12px] text-[#0071E3] hover:underline"
                            style={{ fontWeight: 500 }}
                        >
                            <ListChecks className="w-3.5 h-3.5" aria-hidden="true" />
                            Xem tiến trình
                        </Link>
                        {app.status === 'interview' && (
                            <Link
                                href="/my-interviews"
                                className="inline-flex items-center gap-1 text-[12px] text-[#6366F1] hover:underline"
                                style={{ fontWeight: 500 }}
                            >
                                <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
                                Xem lịch phỏng vấn
                            </Link>
                        )}
                    </div>
                </div>

                <div className="w-8 flex-shrink-0">
                    {canWithdraw && (
                        <WithdrawApplicationForm
                            applicationId={app.applicationId}
                            onSuccess={onWithdrawSuccess}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
