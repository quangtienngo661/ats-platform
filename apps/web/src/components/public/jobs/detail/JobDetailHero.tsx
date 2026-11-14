import { Briefcase, Banknote, Clock } from 'lucide-react';
import { Avatar, Badge } from '@/components/ui';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { jobSkillsOf } from '@/lib/job-skills';
import { WORK_TYPE_LABELS, type WorkType } from '@/lib/work-types';

function formatSalary(min?: number | null, max?: number | null): string {
    if (!min && !max) return 'Thỏa thuận';
    const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}M` : `${(n / 1_000).toFixed(0)}K`;
    if (min && max) return `${fmt(min)} – ${fmt(max)} VNĐ`;
    if (min) return `Từ ${fmt(min)} VNĐ`;
    return `Đến ${fmt(max ?? 0)} VNĐ`;
}

function timeAgo(dateStr?: string | null): string {
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

/** Title, company and the facts a candidate scans first. Applying lives in the sidebar card and the mobile bar. */
export function JobDetailHero({ job }: JobDetailHeroProps) {
    const deptName = job.department?.name;
    const skills = jobSkillsOf(job);
    const location = Object.hasOwn(WORK_TYPE_LABELS, job.locationType)
        ? WORK_TYPE_LABELS[job.locationType as WorkType]
        : job.locationType ?? '';

    return (
        <header>
            <div className="flex items-start gap-4">
                <Avatar name={deptName ?? job.title} size={40} />
                <div className="min-w-0 flex-1">
                    <h1 className="break-words text-heading text-ink">{job.title}</h1>
                    {deptName && <p className="mt-1 break-words text-body text-ink-2">{deptName}</p>}
                </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-ink-2">
                <span className="flex items-center gap-1.5">
                    <Briefcase aria-hidden="true" className="size-4 text-ink-3" />
                    {location}
                </span>
                {(job.salaryMin || job.salaryMax) && (
                    <span className="flex items-center gap-1.5 tabular-nums">
                        <Banknote aria-hidden="true" className="size-4 text-ink-3" />
                        {formatSalary(job.salaryMin, job.salaryMax)}
                    </span>
                )}
                {job.publishedAt && (
                    <span className="flex items-center gap-1.5">
                        <Clock aria-hidden="true" className="size-4 text-ink-3" />
                        {timeAgo(job.publishedAt)}
                    </span>
                )}
            </div>

            {skills.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                    {skills.map(s => (
                        <Badge key={s.skillId} tone="accent">{s.name ?? s.skillId}</Badge>
                    ))}
                </div>
            )}
        </header>
    );
}
