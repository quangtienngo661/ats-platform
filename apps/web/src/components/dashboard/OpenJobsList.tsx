import Link from 'next/link';
import { Avatar, StatusChip, Surface } from '@/components/ui';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { WORK_TYPE_LABELS, type WorkType } from '@/lib/work-types';

interface OpenJobsListProps {
    jobs: IJobPostingDto[];
}

export default function OpenJobsList({ jobs }: OpenJobsListProps) {
    const displayed = jobs.slice(0, 5);

    return (
        <Surface className="flex h-full flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="text-title-sm text-ink">Vị trí đang tuyển</h2>
                <Link href="/jobs" className="text-caption font-medium text-accent-text hover:underline">
                    Xem tất cả
                </Link>
            </div>

            {displayed.length === 0 ? (
                <p className="px-5 py-10 text-center text-body-sm text-ink-3">Chưa có tin đang tuyển</p>
            ) : (
                <ul className="divide-y divide-line">
                    {displayed.map((job) => {
                        const appCount = job.applications?.length ?? 0;
                        const location = WORK_TYPE_LABELS[(job.locationType ?? '') as WorkType] ?? job.locationType ?? 'N/A';
                        return (
                            <li key={job.jobId}>
                                <Link
                                    href={`/jobs/${job.jobId}/candidates`}
                                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2/60"
                                >
                                    <Avatar name={job.title ?? 'Job'} size={32} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-body-sm font-medium text-ink" title={job.title}>
                                            {job.title}
                                        </p>
                                        <p className="truncate text-caption tabular-nums text-ink-3">
                                            {location} · {appCount} ứng viên
                                        </p>
                                    </div>
                                    <StatusChip kind="job" value={job.status ?? 'active'} className="shrink-0" />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Surface>
    );
}
