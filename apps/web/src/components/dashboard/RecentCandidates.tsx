import Link from 'next/link';
import { Clock, Star, ChevronRight } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IApplicationDto } from '@/types/interfaces/application.interface';

interface RecentCandidatesProps {
    applications: IApplicationDto[];
}

const STATUS_LABELS: Record<string, string> = {
    applied:   'Ứng tuyển',
    screening: 'Sàng lọc',
    interview: 'Phỏng vấn',
    offer:     'Offer',
    hired:     'Đã tuyển',
    rejected:  'Từ chối',
    cancelled: 'Đã hủy',
};

const STATUS_COLORS: Record<string, string> = {
    applied:   '#94A3B8',
    screening: '#3B82F6',
    interview: '#6366F1',
    offer:     '#34C759',
    hired:     '#0071E3',
    rejected:  '#EF4444',
    cancelled: '#AEAEB2',
};

const STATUS_BG: Record<string, string> = {
    applied:   '#F8FAFC',
    screening: '#EFF6FF',
    interview: '#F5F3FF',
    offer:     '#F0FDF4',
    hired:     '#EBF3FD',
    rejected:  '#FEF2F2',
    cancelled: '#F5F5F7',
};

const AVATAR_COLORS = ['#0071E3', '#6366F1', '#0EA5E9', '#34C759', '#8B5CF6', '#F59E0B'];

function getInitials(fullName: string): string {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getDaysAgo(appliedAt?: string): number {
    if (!appliedAt) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(appliedAt).getTime()) / 86400000));
}

export default function RecentCandidates({ applications }: RecentCandidatesProps) {
    return (
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#F2F2F7] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
                <h3 className="text-[14px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>
                    Ứng viên gần đây
                </h3>
                <Link href="/jobs" className="text-[12px] text-[#0071E3] hover:underline" style={{ fontWeight: 500 }}>
                    Xem tất cả →
                </Link>
            </div>

            {applications.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="text-[13px] text-[#AEAEB2]">Chưa có ứng viên nào</p>
                </div>
            ) : (
                <div className="divide-y divide-[#F2F2F7]">
                    {applications.map((app, idx) => {
                        const fullName = app.candidate?.user?.fullName ?? 'Ứng viên';
                        const initials = getInitials(fullName);
                        const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                        const status = app.status?.toLowerCase() ?? 'applied';
                        const stageLabel = STATUS_LABELS[status] ?? status;
                        const stageColor = STATUS_COLORS[status] ?? '#94A3B8';
                        const stageBg = STATUS_BG[status] ?? '#F5F5F7';
                        const days = getDaysAgo(app.appliedAt);
                        const aiScore = app.screening?.overallScore;

                        return (
                            <Link
                                key={app.applicationId}
                                href={`/jobs/${app.jobId}/candidates/${app.applicationId}`}
                                className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F5F5F7] transition-colors group cursor-pointer"
                            >
                                <div
                                    className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white text-[12px] flex-shrink-0"
                                    style={{ background: avatarColor, fontFamily: SF, fontWeight: 600 }}
                                >
                                    {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] text-[#1D1D1F] truncate tracking-[-0.01em]" style={{ fontWeight: 500 }}>
                                        {fullName}
                                    </p>
                                    <p className="text-[11px] text-[#AEAEB2] truncate">{app.jobPosting?.title ?? 'N/A'}</p>
                                </div>
                                <div className="hidden sm:flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-[#AEAEB2]" />
                                    <span className="text-[11px] text-[#AEAEB2]">{days}d</span>
                                </div>
                                {aiScore != null && Number(aiScore) > 0 && (
                                    <div className="hidden md:flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-[#0071E3] text-[#0071E3]" />
                                        <span className="text-[12px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>
                                            {Number(aiScore).toFixed(1)}
                                        </span>
                                    </div>
                                )}
                                <span
                                    className="text-[11px] rounded-full px-2.5 py-1 flex-shrink-0"
                                    style={{ background: stageBg, color: stageColor, fontWeight: 500 }}
                                >
                                    {stageLabel}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-[#AEAEB2] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
