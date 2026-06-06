'use client';

import Link from 'next/link';
import { ArrowLeft, Star, Clock, Briefcase, Mail } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IApplicationDto } from '@/types/interfaces/application.interface';
import { CandidateOverviewTab } from './ui/CandidateOverviewTab';
import { SERVER_URL } from '@/types/constants/urls';

interface CandidateDetailClientProps {
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


export default function CandidateDetailClient({ application, jobId }: CandidateDetailClientProps) {
    const name = application.candidate?.user?.fullName || 'N/A';
    const email = application.candidate?.user?.email || '';
    const initials = name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();
    const status = statusConfig[application.status] || statusConfig.applied;
    const aiScore = application.screening?.overallScore;
    const linkDownload = `${SERVER_URL}/cvs/${application.cvId}/download?name=${name}`;

    return (
        <div className="lg:px-8 py-5" style={{ fontFamily: SFT }}>
            {/* Back */}
            <Link href={
                `/jobs/${jobId}/candidates`}
                className="inline-flex items-center gap-2 text-[14px] text-[#1D1D1F] hover:text-[#0071E3] transition-colors"
                style={{ fontFamily: SFT, fontWeight: 500 }}
            >
                <ArrowLeft className="w-4 h-4" />
                Quay lại danh sách
            </Link>

            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-[#F2F2F7] mt-6 p-6 mb-6">
                <div className="flex items-start gap-5 flex-wrap md:flex-nowrap">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0071E3] to-[#6366F1] flex items-center justify-center text-white text-[18px] flex-shrink-0" style={{ fontFamily: SF, fontWeight: 700 }}>
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h1 className="text-[24px] text-[#1D1D1F] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                                {name}
                            </h1>
                            <span className="text-[12px] rounded-full px-2.5 py-1" style={{ background: status.bg, color: status.color, fontWeight: 500 }}>
                                {status.label}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap text-[13px] text-[#6E6E73]">
                            <span className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-[#AEAEB2]" />{email}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-[#AEAEB2]" />{application.jobPosting?.title}
                            </span>
                            {aiScore != null && aiScore > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <Star className="w-3.5 h-3.5 text-[#F59E0B]" />
                                    Điểm AI: <span style={{ fontWeight: 600 }}>{aiScore}</span>
                                </span>
                            )}
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-[#AEAEB2]" />
                                {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString('vi-VN') : 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 flex-shrink-0 my-auto">
                        <a
                            className="px-4 py-2 text-[13px] border border-[#E5E5EA] hover:bg-[#F5F5F7] rounded-xl transition-all"
                            href={linkDownload}
                            target="_blank"
                            download
                        >
                            Tải CV
                        </a>
                    </div>
                </div>
            </div>

            {/* Tab Content (Now fully integrated) */}
            <CandidateOverviewTab application={application} />
        </div>
    );
}
