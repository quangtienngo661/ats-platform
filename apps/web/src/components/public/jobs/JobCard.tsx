import Link from 'next/link';
import { Clock, Briefcase, MapPin, Building2, ChevronRight } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';

const formatAmount = (value: number): string => {
    if (value >= 1_000_000_000) {
        const v = value / 1_000_000_000;
        return `${Number.isInteger(v) ? v : v.toFixed(1)} Tỷ`;
    }
    if (value >= 1_000_000) {
        const v = value / 1_000_000;
        return `${Number.isInteger(v) ? v : v.toFixed(1)} Triệu`;
    }
    if (value >= 1_000) {
        const v = value / 1_000;
        return `${Number.isInteger(v) ? v : v.toFixed(1)} Nghìn`;
    }
    return value.toLocaleString('vi-VN');
};

const salaryFormat = (min: number | null | undefined, max: number | null | undefined): string => {
    if (!min && !max) return 'Mức lương thỏa thuận';
    if (!min) return `Lên đến ${formatAmount(max!)}`;
    if (!max) return `Từ ${formatAmount(min)}`;
    if (min === max) return `${formatAmount(min)}`;
    return `${formatAmount(min)} - ${formatAmount(max)}`;
};

function timeAgo(dateStr?: string | null): string {
    if (!dateStr) return 'Mới nhất';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hôm nay';
    if (days === 1) return '1 ngày trước';
    if (days < 7) return `${days} ngày trước`;
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 tuần trước' : `${weeks} tuần trước`;
}

const locationLabel: Record<string, string> = {
    remote: 'Làm việc từ xa (Remote)',
    onsite: 'Tại văn phòng (Onsite)',
    hybrid: 'Linh hoạt (Hybrid)',
};

interface JobCardProps {
    job: IJobPostingDto;
}

export function JobCard({ job }: JobCardProps) {
    const dept = (job as any).department;
    const deptColor = dept?.color || '#0071E3';
    const deptBg = `${deptColor}15`;
    const initial = job.title?.[0]?.toUpperCase() ?? 'J';

    return (
        <Link
            href={`/job-postings/${job.jobId}`}
            className="group flex flex-col bg-white rounded-3xl border border-[#F2F2F7] hover:border-[#E5E5EA] hover:shadow-xl hover:shadow-black/5 transition-all duration-300 overflow-hidden"
            style={{ fontFamily: SFT }}
        >
            <div className="p-5 flex-1 flex flex-col">
                {/* Header: Icon & Salary */}
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: deptBg }}>
                        <Building2 className="w-6 h-6" style={{ color: deptColor }} />
                    </div>
                    <div className="bg-[#F0FDF4] text-[#16A34A] px-3 py-1.5 rounded-full text-[12px]" style={{ fontWeight: 600 }}>
                        {salaryFormat(job.salaryMin, job.salaryMax)}
                    </div>
                </div>

                {/* Main Info */}
                <div className="mb-4 flex-1">
                    <h3 className="text-[16px] text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors leading-snug mb-2 line-clamp-2" style={{ fontFamily: SF, fontWeight: 700 }}>
                        {job.title}
                    </h3>
                    <p className="text-[13px] text-[#6E6E73] flex items-center gap-1.5 truncate" style={{ fontWeight: 500 }}>
                        {dept?.name || 'TalentAI Partner'}
                    </p>
                </div>

                {/* Meta details */}
                <div className="flex flex-col gap-2.5 mb-5 mt-auto">
                    <div className="flex items-center gap-2 text-[12px] text-[#6E6E73]">
                        <MapPin className="w-3.5 h-3.5 text-[#AEAEB2]" />
                        <span className="truncate">{locationLabel[job.locationType || 'onsite'] || job.locationType}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-[#6E6E73]">
                        <Clock className="w-3.5 h-3.5 text-[#AEAEB2]" />
                        <span>Đăng {timeAgo(job.publishedAt || job.createdAt)}</span>
                    </div>
                </div>

                {/* Skills/Tags */}
                {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {job.skills.slice(0, 3).map(s => (
                            <span key={s.skillId} className="text-[11px] bg-[#F5F5F7] text-[#6E6E73] rounded-lg px-2.5 py-1 border border-[#F2F2F7]">
                                {s.name ?? s.skillId}
                            </span>
                        ))}
                        {job.skills.length > 3 && (
                            <span className="text-[11px] bg-[#F5F5F7] text-[#AEAEB2] rounded-lg px-2.5 py-1 border border-[#F2F2F7]">
                                +{job.skills.length - 3}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Footer action */}
            <div className="px-5 py-3 border-t border-[#F2F2F7] bg-[#FAFAFC] flex items-center justify-between group-hover:bg-[#EBF3FD] transition-colors">
                <span className="text-[12px] text-[#6E6E73] group-hover:text-[#0071E3]" style={{ fontWeight: 500 }}>Xem chi tiết</span>
                <ChevronRight className="w-4 h-4 text-[#AEAEB2] group-hover:text-[#0071E3] transition-colors group-hover:translate-x-0.5" />
            </div>
        </Link>
    );
}
