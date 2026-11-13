import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { StatusChip } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import type { ISessionSummary } from '@/types/interfaces/interview.interface';

const DIFFICULTY_LABEL: Record<string, string> = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };

interface SessionCardProps {
    session: ISessionSummary;
}

function sessionHref(session: ISessionSummary): string | undefined {
    if (session.status === 'abandon') return undefined;
    if (session.status === 'completed' || session.status === 'pending_result') {
        return `/mock-interview/${session.sessionId}/result`;
    }
    return `/mock-interview/${session.sessionId}`;
}

function Wrapper({ href, children }: { href?: string; children: ReactNode }) {
    const base = 'flex items-center gap-3 rounded-ctl p-3 transition-colors duration-hover';
    return href ? (
        <Link href={href} className={cn(base, 'group hover:bg-surface-2')}>
            {children}
        </Link>
    ) : (
        <div className={cn(base, 'opacity-70')}>{children}</div>
    );
}

export function SessionCard({ session }: SessionCardProps) {
    const score = session.result?.overallScore;
    const date = new Date(session.startedAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Ho_Chi_Minh',
    });
    const href = sessionHref(session);
    const action = session.status === 'in_progress' ? 'Tiếp tục' : session.status === 'completed' ? 'Xem kết quả' : null;

    return (
        <Wrapper href={href}>
            <span className="min-w-0 flex-1">
                <span className="block break-words text-body-sm font-medium text-ink">{session.topic.name}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-ink-3">
                    <span>{DIFFICULTY_LABEL[session.difficultyLevel] ?? session.difficultyLevel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{date}</span>
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusChip kind="interview" value={session.status} />
                    {action && <span className="text-caption text-accent-text">{action}</span>}
                </span>
            </span>
            {session.status === 'completed' && score !== undefined && score !== null && (
                <span className="shrink-0 text-right">
                    <span className="font-mono text-title-sm tabular-nums text-ink">{Math.round(score)}</span>
                    <span className="block text-caption text-ink-3">/100</span>
                </span>
            )}
            {href && (
                <ChevronRight
                    aria-hidden="true"
                    strokeWidth={1.75}
                    className="size-4 shrink-0 text-ink-3 transition-transform duration-hover group-hover:translate-x-0.5"
                />
            )}
        </Wrapper>
    );
}
