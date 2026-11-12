import { IInterviewSchedule } from '@/types/interfaces/interview.interface';
import type { WorkDay } from '../InterviewScheduleClient';
import { ScheduleDayColumn } from './ScheduleDayColumn';

interface WeekCalendarGridProps {
    weekDays: WorkDay[];
    schedulesByDate: Record<string, IInterviewSchedule[]>;
    today: string;
    onSelectSchedule: (schedule: IInterviewSchedule) => void;
}

export function WeekCalendarGrid({ weekDays, schedulesByDate, today, onSelectSchedule }: WeekCalendarGridProps) {
    return (
        <div className="flex-1 overflow-auto p-4 lg:p-6">
            <div className="grid min-w-[900px] grid-cols-5 gap-3">
                {weekDays.map((day) => (
                    <ScheduleDayColumn
                        key={day.dateKey}
                        day={day}
                        isPast={day.dateKey < today}
                        isToday={day.dateKey === today}
                        schedules={schedulesByDate[day.dateKey] ?? []}
                        onSelectSchedule={onSelectSchedule}
                    />
                ))}
            </div>
        </div>
    );
}