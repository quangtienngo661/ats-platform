'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { CalendarClock, CalendarDays, Clock, ExternalLink, MapPin, User, Video } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { isHttpUrl } from '@/lib/meeting-link';
import type { ICandidateInterviewSchedule } from '@/types/interfaces/interview.interface';
import { groupCandidateSchedules, scheduleEndsAt } from './group-schedules';

interface MyInterviewsClientProps {
    upcoming: ICandidateInterviewSchedule[];
    history: ICandidateInterviewSchedule[];
    historyPage: number;
    historyTotalPages: number;
}

interface Badge {
    label: string;
    color: string;
    bg: string;
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

function badgeFor(schedule: ICandidateInterviewSchedule, now: Date): Badge | null {
    if (schedule.status === 'cancelled') return { label: 'Đã hủy', color: '#6E6E73', bg: '#F5F5F7' };
    if (schedule.status === 'completed') return { label: 'Hoàn thành', color: '#16A34A', bg: '#DCFCE7' };
    if (scheduleEndsAt(schedule) <= now.getTime()) return { label: 'Đã diễn ra', color: '#6E6E73', bg: '#F5F5F7' };
    if (new Date(schedule.startAt).getTime() <= now.getTime()) {
        return { label: 'Đang diễn ra', color: '#D97706', bg: '#FFF7ED' };
    }
    return null;
}

function formatDate(date: Date) {
    return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(date: Date) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function MeetingLink({ link }: { link: string | null }) {
    if (!link) return null;
    if (!isHttpUrl(link)) {
        return (
            <span className="text-[12px] text-[#6E6E73] break-all">
                Đường dẫn phòng họp: <span>{link}</span>
            </span>
        );
    }
    return (
        <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0071E3] text-white text-[12px] hover:bg-[#0062C4] transition-colors"
            style={{ fontWeight: 600 }}
        >
            Tham gia phòng họp
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
    );
}

function InterviewCard({ schedule, now, active }: { schedule: ICandidateInterviewSchedule; now: Date; active: boolean }) {
    const titleId = `interview-${schedule.interviewId}-title`;
    const start = new Date(schedule.startAt);
    const badge = badgeFor(schedule, now);
    const online = schedule.interviewType === 'online';
    const TypeIcon = online ? Video : MapPin;

    return (
        <article
            aria-labelledby={titleId}
            className={`bg-white rounded-2xl border border-[#E5E5EA] p-5 ${active ? '' : 'opacity-80'}`}
        >
            <div className="flex items-start gap-4">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: online ? '#EBF3FD' : '#F5F3FF' }}
                >
                    <TypeIcon className="w-5 h-5" style={{ color: online ? '#0071E3' : '#6366F1' }} aria-hidden="true" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-1">
                        <div className="min-w-0 flex-1">
                            <p
                                id={titleId}
                                className="text-[15px] text-[#1D1D1F] break-words"
                                style={{ fontFamily: SF, fontWeight: 600 }}
                            >
                                {schedule.application.jobPosting.title}
                            </p>
                            <p className="text-[12px] text-[#6E6E73] mt-0.5">
                                {schedule.application.jobPosting.organization.name}
                            </p>
                        </div>

                        {badge && (
                            <span
                                className="text-[10px] rounded-full px-2.5 py-1 flex-shrink-0 inline-flex items-center gap-1"
                                style={{ background: badge.bg, color: badge.color, fontWeight: 600 }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: badge.color }} />
                                {badge.label}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-x-4 gap-y-1 text-[12px] text-[#6E6E73] mt-2 flex-wrap">
                        <span className="flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{formatDate(start)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                            <span className="text-[#1D1D1F]" style={{ fontWeight: 600 }}>{formatTime(start)}</span>
                            <span aria-hidden="true">·</span>
                            <span>{schedule.durationMinutes} phút</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" aria-hidden="true" />
                            Người phỏng vấn: <span>{schedule.interviewer.fullName}</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-x-3 gap-y-2 mt-3 flex-wrap">
                        <span
                            className="text-[11px] rounded-md px-2 py-0.5"
                            style={{ background: '#F5F5F7', color: '#1D1D1F', fontWeight: 500 }}
                        >
                            {online ? 'Trực tuyến' : 'Trực tiếp'}
                        </span>
                        {online
                            ? active && <MeetingLink link={schedule.onlineMeetingLink} />
                            : (
                                <span className="text-[12px] text-[#1D1D1F] break-words">
                                    {schedule.location ?? LOCATION_PENDING}
                                </span>
                            )}
                    </div>
                </div>
            </div>
        </article>
    );
}

function ScheduleGroup({ id, title, children }: { id: string; title: string; children: ReactNode }) {
    return (
        <section aria-labelledby={id} className="mb-8">
            <h2
                id={id}
                className="text-[13px] text-[#6E6E73] uppercase tracking-[0.04em] mb-3"
                style={{ fontFamily: SF, fontWeight: 600 }}
            >
                {title}
            </h2>
            <div className="flex flex-col gap-3">{children}</div>
        </section>
    );
}

function MyInterviewsHeader() {
    return (
        <div className="mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6366F1] flex items-center justify-center">
                    <CalendarClock className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div>
                    <h1
                        className="text-[24px] text-[#1D1D1F] tracking-[-0.02em]"
                        style={{ fontFamily: SF, fontWeight: 700 }}
                    >
                        Lịch phỏng vấn
                    </h1>
                    <p className="text-[13px] text-[#6E6E73]" style={{ fontFamily: SFT }}>
                        Giờ hiển thị theo múi giờ trên thiết bị của bạn
                    </p>
                </div>
            </div>
        </div>
    );
}

export function MyInterviewsClient({ upcoming, history, historyPage, historyTotalPages }: MyInterviewsClientProps) {
    const now = useNow();
    const hasMoreHistory = historyPage < historyTotalPages;
    const isEmpty = upcoming.length === 0 && history.length === 0;

    let content: ReactNode;
    if (isEmpty) {
        content = (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#E5E5EA] text-center px-4">
                <p className="text-[15px] text-[#6E6E73]" style={{ fontWeight: 500 }}>
                    Bạn chưa có lịch phỏng vấn nào
                </p>
                <p className="text-[12px] text-[#AEAEB2] mt-1">
                    Khi nhà tuyển dụng hẹn phỏng vấn, lịch sẽ hiện ở đây
                </p>
            </div>
        );
    } else if (!now) {
        content = (
            <div className="flex flex-col gap-3" aria-busy="true">
                {[0, 1].map((index) => (
                    <div key={index} className="h-28 rounded-2xl bg-white border border-[#E5E5EA] animate-pulse" />
                ))}
            </div>
        );
    } else {
        const groups = groupCandidateSchedules([...upcoming, ...history], now);
        content = (
            <>
                {groups.upcoming.length > 0 && (
                    <ScheduleGroup id="my-interviews-upcoming" title="Sắp tới">
                        {groups.upcoming.map((schedule) => (
                            <InterviewCard key={schedule.interviewId} schedule={schedule} now={now} active />
                        ))}
                    </ScheduleGroup>
                )}
                {(groups.past.length > 0 || hasMoreHistory) && (
                    <ScheduleGroup id="my-interviews-past" title="Đã qua & đã hủy">
                        {groups.past.map((schedule) => (
                            <InterviewCard key={schedule.interviewId} schedule={schedule} now={now} active={false} />
                        ))}
                        {hasMoreHistory && (
                            <Link
                                href={`/my-interviews?page=${historyPage + 1}`}
                                scroll={false}
                                className="self-center px-4 py-2 rounded-lg text-[13px] bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#EBEBF0] transition-colors"
                                style={{ fontWeight: 500 }}
                            >
                                Xem thêm
                            </Link>
                        )}
                    </ScheduleGroup>
                )}
            </>
        );
    }

    return (
        <div className="w-full max-w-[900px] mx-auto px-4 md:px-6 py-8" style={{ fontFamily: SFT }}>
            <MyInterviewsHeader />
            {content}
        </div>
    );
}
