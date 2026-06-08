'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import { SFT } from '@/types/fonts/fonts';
import { IApplicationDto } from '@/types/interfaces/application.interface';
import { IInterviewSchedule } from '@/types/interfaces/interview.interface';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';
import { ScheduleToolbar } from './ui/ScheduleToolbar';
import { WeekCalendarGrid } from './ui/WeekCalendarGrid';
import { ScheduleDetailDrawer } from './ui/ScheduleDetailDrawer';
import { MutateInterviewScheduleModal } from './ui/MutateInterviewScheduleModal';
import { ScheduleSummaryStrip } from './ui/ScheduleSummaryStrip';

export interface WorkDay {
    date: Date;
    dateKey: string;
    label: string;
    shortLabel: string;
}

interface InterviewScheduleClientProps {
    schedules: IInterviewSchedule[];
    applications: IApplicationDto[];
    interviewers: IRecruiterDto[];
    currentRecruiter: IRecruiterDto | null;
    selectedWeekStart: string;
    minWeekStart: string;
    today: string;
}

function addDays(date: Date, amount: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    return result;
}

function toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
    return new Date(`${value}T00:00:00`);
}

function getScheduleDateKey(schedule: IInterviewSchedule) {
    return toDateKey(new Date(schedule.scheduledDate));
}

const weekdayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

export default function InterviewScheduleClient({
    schedules,
    applications,
    interviewers,
    currentRecruiter,
    selectedWeekStart,
    minWeekStart,
    today,
}: InterviewScheduleClientProps) {
    const router = useRouter();
    const [selectedSchedule, setSelectedSchedule] = useState<IInterviewSchedule | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [reschedulingSchedule, setReschedulingSchedule] = useState<IInterviewSchedule | null>(null);

    const weekDays = useMemo<WorkDay[]>(() => {
        const start = parseDateKey(selectedWeekStart);
        return weekdayLabels.map((label, index) => {
            const date = addDays(start, index);
            return {
                date,
                dateKey: toDateKey(date),
                label,
                shortLabel: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
            };
        });
    }, [selectedWeekStart]);

    const schedulesByDate = useMemo(() => {
        return schedules.reduce<Record<string, IInterviewSchedule[]>>((acc, schedule) => {
            const key = getScheduleDateKey(schedule);
            acc[key] = [...(acc[key] ?? []), schedule].sort((a, b) => (
                new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
            ));
            return acc;
        }, {});
    }, [schedules]);

    const canGoPrevious = selectedWeekStart > minWeekStart;
    const weekTitle = `${weekDays[0]?.shortLabel ?? ''} - ${weekDays[4]?.shortLabel ?? ''}`;

    const goToWeek = (direction: 'previous' | 'next') => {
        const offset = direction === 'next' ? 7 : -7;
        const nextWeek = toDateKey(addDays(parseDateKey(selectedWeekStart), offset));
        router.push(`/interviews?weekStart=${nextWeek}`);
    };

    const handleScheduleChanged = () => {
        setSelectedSchedule(null);
        setReschedulingSchedule(null);
        setShowCreateModal(false);
        router.refresh();
    };

    return (
        <div className="flex h-full flex-col bg-[#F5F5F7]" style={{ fontFamily: SFT }}>
            <div className="border-b border-[#F2F2F7] bg-white px-4 py-4 lg:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF3FD]">
                            <CalendarDays className="h-5 w-5 text-[#0071E3]" />
                        </div>
                        <div>
                            <h1 className="text-[18px] text-[#1D1D1F]" style={{ fontWeight: 700 }}>Lịch phỏng vấn</h1>
                            <p className="text-[13px] text-[#6E6E73]">Tuần {weekTitle}</p>
                        </div>
                    </div>

                    <ScheduleToolbar
                        canGoPrevious={canGoPrevious}
                        onPrevious={() => goToWeek('previous')}
                        onNext={() => goToWeek('next')}
                        onCreate={() => setShowCreateModal(true)}
                    />
                </div>
            </div>

            <ScheduleSummaryStrip schedules={schedules} applications={applications} interviewers={interviewers} />

            <WeekCalendarGrid
                weekDays={weekDays}
                schedulesByDate={schedulesByDate}
                today={today}
                onSelectSchedule={setSelectedSchedule}
            />

            {selectedSchedule && (
                <ScheduleDetailDrawer
                    schedule={selectedSchedule}
                    onClose={() => setSelectedSchedule(null)}
                    onChanged={handleScheduleChanged}
                    onReschedule={(schedule) => {
                        setSelectedSchedule(null);
                        setReschedulingSchedule(schedule);
                    }}
                />
            )}

            {showCreateModal && (
                <MutateInterviewScheduleModal
                    applications={applications}
                    interviewers={interviewers}
                    currentRecruiter={currentRecruiter}
                    defaultDate={weekDays.find((day) => day.dateKey >= today)?.dateKey ?? weekDays[0]?.dateKey ?? today}
                    minDate={today}
                    onClose={() => {
                        setShowCreateModal(false);
                        router.refresh();
                    }}
                />
            )}

            {reschedulingSchedule && (
                <MutateInterviewScheduleModal
                    schedule={reschedulingSchedule}
                    applications={applications}
                    interviewers={interviewers}
                    currentRecruiter={currentRecruiter}
                    defaultDate={getScheduleDateKey(reschedulingSchedule)}
                    minDate={today}
                    onClose={() => {
                        setReschedulingSchedule(null);
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}
