import { MapPin, Briefcase, XCircle, Star } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IApplicationCard, IApplicationDto } from '@/types/interfaces/application.interface';

interface ApplicationCardProps {
    application: IApplicationCard;
    onWithdraw: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    applied: { label: 'Đã nộp', color: '#0071E3', bg: '#EBF3FD' },
    screening: { label: 'Sàng lọc AI', color: '#0EA5E9', bg: '#F0F9FF' },
    interview: { label: 'Phỏng vấn', color: '#6366F1', bg: '#F5F3FF' },
    offer: { label: 'Offer', color: '#34C759', bg: '#E8F5E9' },
    hired: { label: 'Được tuyển', color: '#16A34A', bg: '#DCFCE7' },
    rejected: { label: 'Từ chối', color: '#DC2626', bg: '#FEF2F2' },
    withdrawn: { label: 'Đã rút', color: '#6E6E73', bg: '#F5F5F7' },
};

const LOCATION_LABELS: Record<string, string> = {
    onsite: 'Tại văn phòng',
    remote: 'Từ xa',
    hybrid: 'Hybrid',
};

function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
}

// Pipeline steps for visual progress
const PIPELINE_STEPS = ['applied', 'screening', 'interview', 'offer', 'hired'] as const;
const ACTIVE_STATUSES = new Set(PIPELINE_STEPS as readonly string[]);

function PipelineProgress({ status }: { status: string }) {
    if (!ACTIVE_STATUSES.has(status)) return null;

    const currentIdx = PIPELINE_STEPS.indexOf(status as typeof PIPELINE_STEPS[number]);

    return (
        <div className="flex items-center gap-1 mt-3">
            {PIPELINE_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-1 flex-1">
                    <div
                        className="h-1.5 rounded-full flex-1 transition-colors"
                        style={{
                            background: i <= currentIdx
                                ? STATUS_CONFIG[step]?.color ?? '#0071E3'
                                : '#E5E5EA',
                        }}
                    />
                </div>
            ))}
        </div>
    );
}

export function ApplicationCard({ application: app, onWithdraw }: ApplicationCardProps) {
    const status = STATUS_CONFIG[app.status] ?? { label: app.status, color: '#6E6E73', bg: '#F5F5F7' };
    const canWithdraw = ['applied', 'screening'].includes(app.status);
    const dateStr = app.appliedAt;

    return (
        <div className="group bg-white rounded-2xl border border-[#E5E5EA] p-5 hover:shadow-md hover:shadow-black/5 transition-all">
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: status.bg }}
                >
                    <Briefcase className="w-5 h-5" style={{ color: status.color }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-1">
                        <div className="min-w-0">
                            <p
                                className="text-[15px] text-[#1D1D1F] truncate"
                                style={{ fontFamily: SF, fontWeight: 600 }}
                            >
                                {app.jobTitle ?? '—'}
                            </p>
                            <p className="text-[12px] text-[#6E6E73] mt-0.5">
                                {app.departmentName ?? '—'}
                            </p>
                        </div>

                        {/* Status badge */}
                        <span
                            className="text-[11px] rounded-full px-2.5 py-1 flex-shrink-0 inline-flex items-center gap-1"
                            style={{ background: status.bg, color: status.color, fontWeight: 600 }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
                            {status.label}
                        </span>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-[12px] text-[#AEAEB2] mt-1.5 flex-wrap">
                        {app.locationType && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {LOCATION_LABELS[app.locationType] || app.locationType}
                            </span>
                        )}
                        <span>Nộp {formatDate(dateStr)}</span>
                        {app.aiScore != null && (
                            <span className="flex items-center gap-1 text-[#F59E0B]">
                                <Star className="w-3 h-3" />
                                AI Score: {app.aiScore}%
                            </span>
                        )}
                    </div>

                    {/* Pipeline */}
                    <PipelineProgress status={app.status} />
                </div>

                {/* Withdraw */}
                {canWithdraw && (
                    <button
                        onClick={onWithdraw}
                        className="p-2 rounded-lg text-[#FF3B30] hover:bg-[#FFE5E5] transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                        title="Rút đơn"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
