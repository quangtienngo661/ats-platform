import { Badge } from '@/components/ui';
import { cn } from '@/components/ui/cn';
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
            aria-label={`${day.label}, ${day.shortLabel}`}
            className={cn(
                'min-h-[560px] min-w-0 rounded-card p-2',
                isToday ? 'bg-accent-soft/40' : 'bg-surface-2',
                isPast && 'opacity-60',
            )}
        >
            <div className="flex items-center justify-between gap-2 px-2 py-2">
                <div aria-current={isToday ? 'date' : undefined}>
                    <p className={cn('text-body-sm font-medium', isToday ? 'text-accent-text' : 'text-ink')}>{day.label}</p>
                    <p className="mt-0.5 text-caption tabular-nums text-ink-3">{day.shortLabel}</p>
                </div>
                {isToday && <Badge tone="accent">Hôm nay</Badge>}
            </div>

            <div className="space-y-2">
                {schedules.length > 0 ? schedules.map((schedule) => (
                    <ScheduleCard key={schedule.interviewId} schedule={schedule} onSelect={onSelectSchedule} />
                )) : (
                    <p className="px-2 py-1 text-caption text-ink-3">
                        {isPast ? 'Không hiển thị lịch đã qua' : 'Chưa có lịch phỏng vấn'}
                    </p>
                )}
            </div>
        </section>
    );
}
