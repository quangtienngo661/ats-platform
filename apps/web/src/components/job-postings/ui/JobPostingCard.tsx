import Link from 'next/link';
import { Clock, MapPin, MoreHorizontal, Users } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    IconButton,
    StatusChip,
    Surface,
} from '@/components/ui';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { WORK_TYPE_LABELS, type WorkType } from '@/lib/work-types';

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

const salaryFormat = (min: number | null, max: number | null): string => {
    if (min === null && max === null) return 'Thỏa thuận';
    if (min === null) return `Đến ${formatAmount(max ?? 0)} VNĐ`;
    if (max === null) return `Từ ${formatAmount(min)} VNĐ`;
    if (min === max) return `${formatAmount(min)} VNĐ`;
    return `${formatAmount(min)} - ${formatAmount(max)} VNĐ`;
};

interface JobPostingCardProps {
    job: IJobPostingDto;
    onEdit: (job: IJobPostingDto) => void;
    onDelete: (job: IJobPostingDto) => void;
}

function timeAgo(dateStr?: string | null): string {
    if (!dateStr) return 'Bản nháp';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hôm nay';
    if (days === 1) return '1 ngày trước';
    if (days < 7) return `${days} ngày trước`;
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 tuần trước' : `${weeks} tuần trước`;
}

type TApplication = { status?: string };

export function JobPostingCard({ job, onEdit, onDelete }: JobPostingCardProps) {
    const skills = job.jobPostingSkills?.map((jps) => jps.skill.name) || [];
    const applicantCount = job.applications?.filter((a: TApplication) => a.status !== 'cancelled').length || 0;

    return (
        <Surface className="p-4 transition-shadow duration-hover hover:shadow-e2">
            <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="min-w-0 break-words text-title-sm text-ink" title={job.title}>
                            {job.title}
                        </h3>
                        <StatusChip kind="job" value={job.status || 'draft'} />
                    </div>
                    <p className="mt-0.5 truncate text-body-sm text-ink-3" title={job.department?.name}>
                        {job.department?.name || 'N/A'}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-caption text-ink-3">
                        <span className="inline-flex items-center gap-1">
                            <MapPin aria-hidden="true" strokeWidth={1.75} className="size-3.5" />
                            {WORK_TYPE_LABELS[job.locationType as WorkType] || job.locationType}
                        </span>
                        <span className="tabular-nums text-ink-2">{salaryFormat(job.salaryMin ?? null, job.salaryMax ?? null)}</span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                            <Clock aria-hidden="true" strokeWidth={1.75} className="size-3.5" />
                            {timeAgo(job.publishedAt || job.createdAt)}
                        </span>
                        <Link
                            href={`/jobs/${job.jobId}/candidates`}
                            className="inline-flex items-center gap-1 font-medium text-accent-text hover:underline"
                        >
                            <Users aria-hidden="true" strokeWidth={1.75} className="size-3.5" />
                            <span className="tabular-nums">{applicantCount}</span> ứng viên
                        </Link>
                    </div>

                    {skills.length > 0 && (
                        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Kỹ năng">
                            {skills.map((t) => (
                                <li key={t} className="rounded-ctl bg-surface-2 px-2 py-0.5 text-micro text-ink-2">
                                    {t}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <IconButton size="sm" aria-label={`Thao tác với tin ${job.title}`}>
                            <MoreHorizontal strokeWidth={1.75} />
                        </IconButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/jobs/${job.jobId}/candidates`}>Xem ứng viên</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/jobs/${job.jobId}/kanban`}>Kanban</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onEdit(job)}>Sửa tin</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem destructive onSelect={() => onDelete(job)}>
                            Xóa tin
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </Surface>
    );
}
