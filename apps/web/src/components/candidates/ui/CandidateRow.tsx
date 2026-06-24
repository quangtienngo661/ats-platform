import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IApplicationDto } from '@/types/interfaces/application.interface';

interface CandidateRowProps {
    application: IApplicationDto;
    jobId: string;
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    applied: { label: 'Mới', bg: '#EBF3FD', color: '#0071E3' },
    screening: { label: 'Sàng lọc', bg: '#F3E8FF', color: '#8B5CF6' },
    interview: { label: 'Phỏng vấn', bg: '#FFFBEB', color: '#D97706' },
    offer: { label: 'Offer', bg: '#F0FDF4', color: '#16A34A' },
    hired: { label: 'Đã tuyển', bg: '#E8F5E9', color: '#34C759' },
    rejected: { label: 'Từ chối', bg: '#FEF2F2', color: '#DC2626' },
    cancelled: { label: 'Đã hủy', bg: '#F5F5F7', color: '#AEAEB2' },
};

function getScoreColor(score: number): string {
    if (score >= 90) return '#34C759';
    if (score >= 75) return '#0071E3';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
}

function timeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
}

export function CandidateRow({ application, jobId }: CandidateRowProps) {
    const name = application.candidate?.user?.fullName || 'N/A';
    const email = application.candidate?.user?.email || 'N/A';
    const initials = name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();
    const jobTitle = application.jobPosting?.title || '';
    const deptName = application.jobPosting?.department?.name || '';
    const status = statusConfig[application.status] || statusConfig.applied;
    const aiScore = application.screening?.overallScore;

    return (
        <tr className="border-b border-[#F2F2F7] last:border-0 hover:bg-[#FAFAFA] transition-colors group">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0071E3] to-[#6366F1] flex items-center justify-center text-white text-[11px]" style={{ fontFamily: SF, fontWeight: 600 }}>
                        {initials}
                    </div>
                    <div>
                        <p className="text-[14px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 500 }}>{name}</p>
                        <p className="text-[12px] text-[#AEAEB2]">{email}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <p className="text-[13px] text-[#1D1D1F]">{jobTitle}</p>
                <p className="text-[12px] text-[#AEAEB2]">{deptName}</p>
            </td>
            <td className="px-6 py-4">
                {aiScore != null && aiScore > 0 ? (
                    <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${aiScore}%`, background: getScoreColor(aiScore) }} />
                        </div>
                        <span className="text-[13px] font-medium" style={{ color: getScoreColor(aiScore) }}>{aiScore}</span>
                    </div>
                ) : (
                    <span className="text-[12px] text-[#AEAEB2]">Chưa có</span>
                )}
            </td>
            <td className="px-6 py-4">
                <span className="text-[11px] rounded-full px-2.5 py-1" style={{ background: status.bg, color: status.color, fontWeight: 500 }}>
                    {status.label}
                </span>
            </td>
            <td className="px-6 py-4">
                <span className="text-[12px] text-[#AEAEB2]">{timeAgo(application.appliedAt)}</span>
            </td>
            <td className="px-6 py-4 text-right">
                <Link href={`/jobs/${jobId}/candidates/${application.applicationId}`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[12px] text-[#0071E3]"
                    style={{ fontWeight: 500 }}>
                    Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </td>
        </tr>
    );
}
