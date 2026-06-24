import { Briefcase, DollarSign, Clock, MapPin } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { ApplyButton } from './ApplyButton';

function formatSalary(min?: number | null, max?: number | null): string {
    if (!min && !max) return 'Thỏa thuận';
    const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}M` : `${(n / 1_000).toFixed(0)}K`;
    if (min && max) return `${fmt(min)} – ${fmt(max)} VNĐ`;
    if (min) return `Từ ${fmt(min)} VNĐ`;
    return `Đến ${fmt(max!)} VNĐ`;
}

function timeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
    if (days < 1) return 'Hôm nay';
    if (days === 1) return 'Hôm qua';
    if (days < 7) return `${days} ngày trước`;
    if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
    return `${Math.floor(days / 30)} tháng trước`;
}

interface JobDetailHeroProps {
    job: IJobPostingDto;
    isLoggedIn: boolean;
    available: boolean;
}

function formatLocation(locationType?: string): string {
    if (locationType === 'remote') return 'Remote';
    if (locationType === 'hybrid') return 'Hybrid';
    if (locationType === 'onsite') return 'On-site';
    return locationType ?? '';
}


export function JobDetailHero({ job, isLoggedIn, available }: JobDetailHeroProps) {
    const initial = job.title?.[0]?.toUpperCase() ?? 'J';
    const deptName = (job as any).department?.name;

    return (
        <div className="bg-white rounded-2xl border border-[#E5E5EA] p-7">
            {/* Title row */}
            <div className="flex items-start gap-5 mb-6">
                <div
                    className="w-[72px] h-[72px] rounded-2xl bg-[#0071E3] flex items-center justify-center text-white text-[24px] flex-shrink-0"
                    style={{ fontFamily: SF, fontWeight: 700 }}
                >
                    {initial}
                </div>
                <div className="flex-1">
                    <h1 className="text-[26px] text-[#1D1D1F] tracking-[-0.02em] mb-1" style={{ fontFamily: SF, fontWeight: 700 }}>
                        {job.title}
                    </h1>
                    {deptName && (
                        <p className="text-[15px] text-[#0071E3]" style={{ fontWeight: 500 }}>{deptName}</p>
                    )}
                </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-[14px] text-[#6E6E73] mb-6" style={{ fontFamily: SFT }}>
                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" />{formatLocation(job.locationType)}</span>
                {(job.salaryMin || job.salaryMax) && (
                    <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" />{formatSalary(job.salaryMin, job.salaryMax)}</span>
                )}
                {job.publishedAt && (
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{timeAgo(job.publishedAt)}</span>
                )}
            </div>

            {/* Skill tags */}
            {job.skills && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {job.skills.map(s => (
                        <span key={s.skillId} className="text-[12px] bg-[#EBF3FD] text-[#0071E3] rounded-lg px-3 py-1" style={{ fontWeight: 500 }}>
                            {s.name ?? s.skillId}
                        </span>
                    ))}
                </div>
            )}

            {/* Desktop Apply Button */}
            <div className="hidden lg:block">
                <ApplyButton job={job} isLoggedIn={isLoggedIn} available={available} />
            </div>
        </div>
    );
}
