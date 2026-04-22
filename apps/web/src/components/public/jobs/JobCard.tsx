import Link from 'next/link';
import { Clock, Briefcase, DollarSign } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';

function formatSalary(min?: number, max?: number): string {
    if (!min && !max) return 'Thỏa thuận';
    const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}M` : `${(n / 1_000).toFixed(0)}K`;
    if (min && max) return `${fmt(min)} – ${fmt(max)} VNĐ`;
    if (min) return `Từ ${fmt(min)} VNĐ`;
    return `Đến ${fmt(max!)} VNĐ`;
}

function timeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days < 1) return 'Hôm nay';
    if (days === 1) return 'Hôm qua';
    if (days < 7) return `${days} ngày trước`;
    if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
    return `${Math.floor(days / 30)} tháng trước`;
}

function formatLocation(locationType?: string): string {
    if (locationType === 'remote') return 'Remote';
    if (locationType === 'hybrid') return 'Hybrid';
    if (locationType === 'on-site') return 'On-site';
    return locationType ?? '';
}

interface JobCardProps {
    job: IJobPostingDto;
}

export function JobCard({ job }: JobCardProps) {
    const initial = job.title?.[0]?.toUpperCase() ?? 'J';

    return (
        <Link
            href={`/job-postings/${job.jobId}`}
            className="group flex flex-col gap-4 p-5 bg-white rounded-2xl border border-[#E5E5EA] hover:border-[#0071E3]/40 hover:shadow-lg hover:shadow-black/5 transition-all"
        >
            {/* Header */}
            <div className="flex items-start gap-3">
                <div
                    className="w-11 h-11 rounded-xl bg-[#0071E3] flex items-center justify-center text-white text-[15px] flex-shrink-0"
                    style={{ fontFamily: SF, fontWeight: 700 }}
                >
                    {initial}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors truncate" style={{ fontFamily: SF, fontWeight: 600 }}>
                        {job.title}
                    </h3>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5 truncate" style={{ fontFamily: SFT }}>
                        {/* Department name if included */}
                        {(job as any).department?.name ?? 'Công ty'}
                    </p>
                </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[12px] text-[#AEAEB2]" style={{ fontFamily: SFT }}>
                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{formatLocation(job.locationType)}</span>
                {(job.salaryMin || job.salaryMax) && (
                    <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{formatSalary(job.salaryMin, job.salaryMax)}</span>
                )}
                {job.publishedAt && (
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{timeAgo(job.publishedAt)}</span>
                )}
            </div>

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {job.skills.slice(0, 3).map(s => (
                        <span key={s.skillId} className="text-[11px] bg-[#EBF3FD] text-[#0071E3] rounded-lg px-2.5 py-1" style={{ fontWeight: 500 }}>
                            {s.name ?? s.skillId}
                        </span>
                    ))}
                    {job.skills.length > 3 && (
                        <span className="text-[11px] bg-[#F5F5F7] text-[#AEAEB2] rounded-lg px-2.5 py-1">
                            +{job.skills.length - 3}
                        </span>
                    )}
                </div>
            )}
        </Link>
    );
}
