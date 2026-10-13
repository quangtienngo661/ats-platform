import { IInterviewSchedule } from '@/types/interfaces/interview.interface';
import type { WorkDay } from '../InterviewScheduleClient';
import { ScheduleCard } from './ScheduleCard';

interface ScheduleDayColumnProps {
    day: WorkDay;
    schedules: IInterviewSchedule[];
    isPast: boolean;
    isToday: boolean;
    onSelectSchedule: (schedule: IInterviewSchedule) => void;
}

export function ScheduleDayColumn({ day, schedules, isPast, isToday, onSelectSchedule }: ScheduleDayColumnProps) {
    return (
        <section
            className={`min-h-[560px] rounded-2xl p-2 ${isToday ? 'bg-[#EBF3FD] ring-1 ring-[#BBD7F8]' : 'bg-[#F5F5F7]'} ${isPast ? 'opacity-55' : ''}`}
        >
            <div className="flex items-center justify-between gap-2 px-2 py-2">
                <div>
                    <p className={`text-[13px] ${isToday ? 'text-[#0071E3]' : 'text-[#1D1D1F]'}`} style={{ fontWeight: 600 }}>{day.label}</p>
                    <p className="mt-0.5 text-[12px] text-[#AEAEB2]">{day.shortLabel}</p>
                </div>
                {isToday && (
                    <span className="rounded-full bg-[#0071E3] px-2 py-0.5 text-[10px] text-white" style={{ fontWeight: 600 }}>
                        Hôm nay
                    </span>
                )}
            </div>

            <div className="space-y-2">
                {schedules.length > 0 ? schedules.map((schedule) => (
                    <ScheduleCard key={schedule.interviewId} schedule={schedule} onSelect={onSelectSchedule} />
                )) : (
                    <p className="px-2 py-1 text-[12px] text-[#AEAEB2]">
                        {isPast ? 'Không hiển thị lịch đã qua' : 'Chưa có lịch phỏng vấn'}
                    </p>
                )}
            </div>
        </section>
    );
}
