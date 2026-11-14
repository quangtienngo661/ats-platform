'use client';

import { effectiveScreeningScores } from '@ats-platform/types';
import Link from 'next/link';
import { PanelRight } from 'lucide-react';
import { Avatar, Badge, Checkbox, IconButton, ScoreBar, StatusChip, TD } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { IApplicationDto } from '@/types/interfaces/application.interface';

interface CandidateRowProps {
    application: IApplicationDto;
    jobId: string;
    selected: boolean;
    onToggle: (applicationId: string) => void;
    /** Opens the quick-peek panel for this application. Without it the row has no peek button. */
    onPeek?: (applicationId: string) => void;
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

/**
 * One application in the candidate table. From 768 px it is a table row; below that the same cells wrap into a
 * card (checkbox · name · peek on the first line, score, then stage and date), so nothing is hidden on a phone.
 */
export function CandidateRow({ application, jobId, selected, onToggle, onPeek }: CandidateRowProps) {
    const name = application.candidate?.user?.fullName || 'N/A';
    const email = application.candidate?.user?.email || 'N/A';
    const screeningScores = effectiveScreeningScores(application.screening ?? {});
    const appliedAgo = timeAgo(application.appliedAt);

    return (
        <tr
            className={cn(
                'transition-colors duration-hover',
                'max-md:flex max-md:flex-wrap max-md:items-start max-md:gap-x-3 max-md:gap-y-2 max-md:border-b',
                'max-md:border-line max-md:p-3 max-md:last:border-b-0',
                'md:[&>td]:border-b md:[&>td]:border-line md:[&:last-child>td]:border-b-0',
                selected ? 'bg-accent-soft/40 hover:bg-accent-soft/60' : 'hover:bg-surface-2/60',
            )}
        >
            <TD className="max-md:order-1 max-md:p-0 max-md:pt-2">
                <Checkbox
                    aria-label={`Chọn ${name}`}
                    checked={selected}
                    onChange={() => onToggle(application.applicationId)}
                />
            </TD>
            <TD className="max-md:order-2 max-md:min-w-0 max-md:flex-1 max-md:p-0">
                <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={name} size={32} />
                    <div className="min-w-0">
                        <Link
                            href={`/jobs/${jobId}/candidates/${application.applicationId}`}
                            title={name}
                            className="block truncate font-medium text-ink underline-offset-2 hover:underline"
                        >
                            {name}
                        </Link>
                        <p className="truncate text-caption text-ink-3" title={email}>
                            {email}
                        </p>
                    </div>
                </div>
            </TD>
            <TD className="max-md:order-4 max-md:basis-full max-md:p-0 max-md:pl-7">
                <span aria-hidden="true" className="mb-1 block text-caption text-ink-3 md:hidden">
                    Gợi ý AI
                </span>
                <div className="flex items-center gap-2">
                    <ScoreBar score={screeningScores.overall} label={`Gợi ý AI cho ${name}`} className="min-w-0 flex-1" />
                    {screeningScores.isReviewed && <Badge tone="accent">Đã duyệt</Badge>}
                </div>
            </TD>
            <TD className="max-md:order-5 max-md:p-0 max-md:pl-7">
                <StatusChip kind="application" value={application.status} />
            </TD>
            <TD className="whitespace-nowrap text-caption tabular-nums text-ink-3 max-md:order-6 max-md:p-0 max-md:leading-5">
                {application.appliedAt && (
                    // Relative time differs between the server render and hydration by design.
                    <time dateTime={application.appliedAt} suppressHydrationWarning>
                        {appliedAgo}
                    </time>
                )}
            </TD>
            <TD className="text-right max-md:order-3 max-md:p-0">
                {onPeek && (
                    <IconButton
                        aria-label={`Xem nhanh ${name}`}
                        size="sm"
                        onClick={() => onPeek(application.applicationId)}
                    >
                        <PanelRight aria-hidden="true" strokeWidth={1.75} />
                    </IconButton>
                )}
            </TD>
        </tr>
    );
}
