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
        <section className={`min-h-[560px] rounded-xl border bg-white ${isToday ? 'border-[#0071E3]' : 'border-[#E5E5EA]'} ${isPast ? 'opacity-55' : ''}`}>
            <div className={`border-b px-4 py-3 ${isToday ? 'border-[#BBD7F8] bg-[#EBF3FD]' : 'border-[#F2F2F7] bg-white'}`}>
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <p className="text-[12px] uppercase tracking-[0.06em] text-[#6E6E73]" style={{ fontWeight: 800 }}>{day.label}</p>
                        <p className="mt-0.5 text-[16px] text-[#1D1D1F]" style={{ fontWeight: 800 }}>{day.shortLabel}</p>
                    </div>
                    {isToday && (
                        <span className="rounded-full bg-[#0071E3] px-2 py-1 text-[10px] text-white" style={{ fontWeight: 800 }}>
                            Hôm nay
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-2 p-3">
                {schedules.length > 0 ? schedules.map((schedule) => (
                    <ScheduleCard key={schedule.interviewId} schedule={schedule} onSelect={onSelectSchedule} />
                )) : (
                    <div className="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-[#E5E5EA] px-3 text-center text-[12px] text-[#AEAEB2]">
                        {isPast ? 'Không hiển thị lịch đã qua' : 'Chưa có lịch phỏng vấn'}
                    </div>
                )}
            </div>
        </section>
    );
}