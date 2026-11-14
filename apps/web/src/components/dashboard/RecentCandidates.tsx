import { effectiveScreeningScores } from '@ats-platform/types';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Avatar, StatusChip, Surface } from '@/components/ui';
import { IApplicationDto } from '@/types/interfaces/application.interface';

interface RecentCandidatesProps {
    applications: IApplicationDto[];
}

function getDaysAgo(appliedAt?: string): number {
    if (!appliedAt) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(appliedAt).getTime()) / 86400000));
}

export default function RecentCandidates({ applications }: RecentCandidatesProps) {
    return (
        <Surface className="flex h-full flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="text-title-sm text-ink">Ứng viên gần đây</h2>
                <Link href="/jobs" className="text-caption font-medium text-accent-text hover:underline">
                    Xem tất cả
                </Link>
            </div>

            {applications.length === 0 ? (
                <p className="px-5 py-10 text-center text-body-sm text-ink-3">Chưa có ứng viên mới</p>
            ) : (
                <ul className="divide-y divide-line">
                    {applications.map((app) => {
                        const fullName = app.candidate?.user?.fullName ?? 'Ứng viên';
                        const status = app.status?.toLowerCase() ?? 'applied';
                        const days = getDaysAgo(app.appliedAt);
                        const aiScore = effectiveScreeningScores(app.screening ?? {}).overall;

                        return (
                            <li key={app.applicationId}>
                                <Link
                                    href={`/jobs/${app.jobId}/candidates/${app.applicationId}`}
                                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2/60"
                                >
                                    <Avatar name={fullName} size={32} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-body-sm font-medium text-ink" title={fullName}>
                                            {fullName}
                                        </p>
                                        <p className="truncate text-caption text-ink-3" title={app.jobPosting?.title}>{app.jobPosting?.title ?? 'N/A'}</p>
                                    </div>
                                    {aiScore != null && Number(aiScore) > 0 && (
                                        <span className="hidden items-center gap-1 text-caption tabular-nums text-ink-2 md:flex">
                                            <Star size={12} aria-hidden="true" className="text-ink-3" />
                                            {Number(aiScore).toFixed(1)}
                                        </span>
                                    )}
                                    <span className="hidden w-20 text-right text-caption tabular-nums text-ink-3 sm:block">
                                        {days === 0 ? 'Hôm nay' : `${days} ngày trước`}
                                    </span>
                                    <StatusChip kind="application" value={status} className="shrink-0" />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Surface>
    );
}
