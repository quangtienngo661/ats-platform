import Link from 'next/link';
import { Badge } from '@/components/ui';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { jobSkillsOf } from '@/lib/job-skills';
import { WORK_TYPE_LABELS, type WorkType } from '@/lib/work-types';

/** Skills shown on a card; the rest are counted as "+n". */
const MAX_SKILLS = 3;

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
    if (!min) return `Lên đến ${formatAmount(max ?? 0)}`;
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

/** First letter of the first two words: "TalentAI Partner" → "TP". */
function initialsOf(name: string): string {
    return name
        .normalize('NFC')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase();
}

interface JobCardProps {
    job: IJobPostingDto;
}

/**
 * One posting in the job list. The whole card is a single link: it lifts 2 px on hover and gives a little on
 * press. Title clamps to two lines and the company to one, each with the full text in `title`, so a 120-character
 * name never pushes the card wider than a 390 px phone.
 */
export function JobCard({ job }: JobCardProps) {
    const company = job.department?.name || 'TalentAI Partner';
    const workType = WORK_TYPE_LABELS[(job.locationType || 'onsite') as WorkType] || job.locationType;
    const skills = jobSkillsOf(job);

    return (
        <Link
            href={`/job-postings/${job.jobId}`}
            className="group flex gap-3 rounded-card bg-surface p-4 shadow-e1 transition duration-hover ease-out-expo hover:-translate-y-0.5 hover:shadow-e3 active:scale-[.995] active:duration-press sm:gap-4 sm:p-5"
        >
            <span
                aria-hidden="true"
                className="flex size-10 shrink-0 select-none items-center justify-center rounded-card bg-surface-2 text-body-sm font-medium text-ink-2"
            >
                {initialsOf(company)}
            </span>

            {/*
              Phones stack title, salary, company and then skills with the posted time on the right. From 640 px the
              salary and the time take a right-hand column, so a card without skills is two rows high.
            */}
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] content-start gap-x-4">
                <h3
                    title={job.title}
                    className="col-span-2 line-clamp-2 break-words text-title-sm text-ink sm:col-span-1"
                >
                    {job.title}
                </h3>
                <p className="col-span-2 mt-1 text-body-sm font-medium tabular-nums text-ink sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:mt-0 sm:pt-0.5 sm:text-right">
                    {salaryFormat(job.salaryMin, job.salaryMax)}
                </p>
                <p className="col-span-2 mt-1 flex min-w-0 items-center gap-1.5 text-body-sm text-ink-3 sm:col-span-1 sm:row-start-2">
                    <span title={company} className="min-w-0 truncate">
                        {company}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="shrink-0">{workType}</span>
                </p>
                <p className="col-start-2 row-start-4 mt-3 self-end text-right text-caption text-ink-3 sm:row-start-2 sm:mt-1 sm:self-center">
                    Đăng {timeAgo(job.publishedAt || job.createdAt)}
                </p>
                {skills.length > 0 ? (
                    <div className="col-start-1 row-start-4 mt-3 flex min-w-0 flex-wrap gap-1.5 sm:col-span-2 sm:row-start-3">
                        {skills.slice(0, MAX_SKILLS).map((s) => (
                            <Badge key={s.skillId} className="max-w-[12rem]">
                                <span title={s.name ?? s.skillId} className="min-w-0 truncate">
                                    {s.name ?? s.skillId}
                                </span>
                            </Badge>
                        ))}
                        {skills.length > MAX_SKILLS ? (
                            <Badge className="tabular-nums">+{skills.length - MAX_SKILLS}</Badge>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </Link>
    );
}
