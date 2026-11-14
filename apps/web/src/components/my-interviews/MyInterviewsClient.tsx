'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { CalendarDays, ExternalLink, MapPin, Video } from 'lucide-react';
import { Badge, ButtonLink, EmptyState, PageToolbar, Skeleton, StatusChip, Surface } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { isHttpUrl } from '@/lib/meeting-link';
import type { Tone } from '@/lib/status-tones';
import type { ICandidateInterviewSchedule } from '@/types/interfaces/interview.interface';
import { groupCandidateSchedules, scheduleEndsAt } from './group-schedules';

interface MyInterviewsClientProps {
    upcoming: ICandidateInterviewSchedule[];
    history: ICandidateInterviewSchedule[];
    historyPage: number;
    historyTotalPages: number;
}

const LOCATION_PENDING = 'Nhà tuyển dụng sẽ gửi địa điểm';

/**
 * The browser's clock, read only after mount: grouping and the times shown depend on the
 * candidate's own clock and timezone, which the server render does not have (R8).
 */
function useNow(): Date | null {
    const [now, setNow] = useState<Date | null>(null);
    useEffect(() => {
        setNow(new Date());
        const timer = window.setInterval(() => setNow(new Date()), 60_000);
        return () => window.clearInterval(timer);
    }, []);
    return now;
}

/** A state worth a label beyond "scheduled"; null means the plain schedule chip applies. */
function stateFor(schedule: ICandidateInterviewSchedule, now: Date): { label: string; tone: Tone } | null {
    if (schedule.status === 'cancelled') return { label: 'Đã hủy', tone: 'neutral' };
    if (schedule.status === 'completed') return { label: 'Hoàn thành', tone: 'success' };
    if (scheduleEndsAt(schedule) <= now.getTime()) return { label: 'Đã diễn ra', tone: 'neutral' };
    if (new Date(schedule.startAt).getTime() <= now.getTime()) return { label: 'Đang diễn ra', tone: 'warning' };
    return null;
}

function formatDay(date: Date) {
    return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(date: Date) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function dayKey(date: Date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function MeetingLink({ link }: { link: string | null }) {
    if (!link) return null;
    if (!isHttpUrl(link)) {
        return (
            <span className="min-w-0 break-all text-caption text-ink-3">
                Đường dẫn phòng họp: <span>{link}</span>
            </span>
        );
    }
    return (
        <ButtonLink href={link} target="_blank" rel="noopener noreferrer" variant="accent" size="sm">
            Vào phòng họp
            <ExternalLink aria-hidden="true" strokeWidth={1.75} />
        </ButtonLink>
    );
}

function InterviewRow({ schedule, now, active }: { schedule: ICandidateInterviewSchedule; now: Date; active: boolean }) {
    const titleId = `interview-${schedule.interviewId}-title`;
    const start = new Date(schedule.startAt);
    const state = stateFor(schedule, now);
    const online = schedule.interviewType === 'online';
    const TypeIcon = online ? Video : MapPin;

    return (
        <Surface as="article" aria-labelledby={titleId} className="flex gap-4 p-4">
            <div className={cn('w-16 shrink-0', active ? 'text-ink' : 'text-ink-3')}>
                <p className="font-mono text-title tabular-nums">{formatTime(start)}</p>
                <p className="text-caption text-ink-3">{schedule.durationMinutes} phút</p>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p id={titleId} className={cn('break-words text-body font-medium', active ? 'text-ink' : 'text-ink-3')}>
                            {schedule.application.jobPosting.title}
                        </p>
                        <p className="break-words text-body-sm text-ink-3">
                            {schedule.application.jobPosting.organization.name}
                        </p>
                    </div>
                    {state ? (
                        <Badge tone={state.tone} className="shrink-0">
                            {state.label}
                        </Badge>
                    ) : (
                        <StatusChip kind="schedule" value={schedule.status} className="shrink-0" />
                    )}
                </div>

                <p className="text-body-sm text-ink-3">
                    Người phỏng vấn: <span className="text-ink-2">{schedule.interviewer.fullName}</span>
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="inline-flex items-center gap-1.5 text-body-sm text-ink-2">
                        <TypeIcon aria-hidden="true" strokeWidth={1.75} className="size-4 shrink-0" />
                        {online ? 'Trực tuyến' : 'Trực tiếp'}
                    </span>
                    {online ? (
                        active && <MeetingLink link={schedule.onlineMeetingLink} />
                    ) : (
                        <span className="min-w-0 break-words text-body-sm text-ink-2">
                            {schedule.location ?? LOCATION_PENDING}
                        </span>
                    )}
                </div>
            </div>
        </Surface>
    );
}

function DayGroups({ items, now, active }: { items: ICandidateInterviewSchedule[]; now: Date; active: boolean }) {
    const days: { key: string; date: Date; items: ICandidateInterviewSchedule[] }[] = [];
    for (const item of items) {
        const date = new Date(item.startAt);
        const key = dayKey(date);
        const day = days.find((entry) => entry.key === key);
        if (day) day.items.push(item);
        else days.push({ key, date, items: [item] });
    }
    const today = dayKey(now);

    return (
        <>
            {days.map((day) => (
                <div key={day.key}>
                    <h3
                        className={cn(
                            'sticky top-[60px] z-sticky -mx-2 mb-2 flex items-center gap-2 bg-canvas/90 px-2 py-2 text-body-sm font-medium backdrop-blur',
                            active ? 'text-ink' : 'text-ink-3',
                        )}
                    >
                        <CalendarDays aria-hidden="true" strokeWidth={1.75} className="size-4 shrink-0" />
                        <span className="capitalize">{formatDay(day.date)}</span>
                        {day.key === today && <Badge tone="accent">Hôm nay</Badge>}
                    </h3>
                    <div className="flex flex-col gap-2">
                        {day.items.map((schedule) => (
                            <InterviewRow key={schedule.interviewId} schedule={schedule} now={now} active={active} />
                        ))}
                    </div>
                </div>
            ))}
        </>
    );
}

function ScheduleGroup({ id, title, children }: { id: string; title: string; children: ReactNode }) {
    return (
        <section aria-labelledby={id} className="flex flex-col gap-4">
            <h2 id={id} className="text-title-sm text-ink">
                {title}
            </h2>
            {children}
        </section>
    );
}

export function MyInterviewsClient({ upcoming, history, historyPage, historyTotalPages }: MyInterviewsClientProps) {
    const now = useNow();
    const hasMoreHistory = historyPage < historyTotalPages;
    const isEmpty = upcoming.length === 0 && history.length === 0;

    let content: ReactNode;
    if (isEmpty) {
        content = (
            <Surface>
                <EmptyState
                    icon={CalendarDays}
                    title="Chưa có lịch phỏng vấn"
                    description="Khi nhà tuyển dụng hẹn phỏng vấn, lịch sẽ hiện ở đây."
                />
            </Surface>
        );
    } else if (!now) {
        content = (
            <div className="flex flex-col gap-2" aria-busy="true">
                <Skeleton className="h-28 w-full rounded-card" />
                <Skeleton className="h-28 w-full rounded-card" />
            </div>
        );
    } else {
        const groups = groupCandidateSchedules([...upcoming, ...history], now);
        content = (
            <>
                {groups.upcoming.length > 0 && (
                    <ScheduleGroup id="my-interviews-upcoming" title="Sắp tới">
                        <DayGroups items={groups.upcoming} now={now} active />
                    </ScheduleGroup>
                )}
                {(groups.past.length > 0 || hasMoreHistory) && (
                    <ScheduleGroup id="my-interviews-past" title="Đã qua & đã hủy">
                        <DayGroups items={groups.past} now={now} active={false} />
                        {hasMoreHistory && (
                            <ButtonLink
                                href={`/my-interviews?page=${historyPage + 1}`}
                                scroll={false}
                                variant="secondary"
                                className="self-center"
                            >
                                Xem thêm
                            </ButtonLink>
                        )}
                    </ScheduleGroup>
                )}
            </>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
            <PageToolbar title="Lịch phỏng vấn" />
            {content}
        </div>
    );
}
