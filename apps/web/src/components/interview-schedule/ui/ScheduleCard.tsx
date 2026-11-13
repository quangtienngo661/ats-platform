import { Clock, MapPin, UserRound, Video } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { statusTone } from '@/lib/status-tones';
import { IInterviewSchedule } from '@/types/interfaces/interview.interface';

interface ScheduleCardProps {
    schedule: IInterviewSchedule;
    onSelect: (schedule: IInterviewSchedule) => void;
}

function formatTime(value: string) {
    return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/** Only finished or cancelled cards carry a status pill; its tone comes from the shared `schedule` status table. */
const PILL_LABEL: Record<string, string> = { completed: 'Hoàn tất', cancelled: 'Đã hủy' };

export function ScheduleCard({ schedule, onSelect }: ScheduleCardProps) {
    const candidateName = schedule.application?.candidate?.user?.fullName ?? 'Ứng viên';
    const jobTitle = schedule.application?.jobPosting?.title ?? 'Tin tuyển dụng';
    const online = schedule.interviewType === 'online';
    const TypeIcon = online ? Video : MapPin;
    const pillLabel = PILL_LABEL[schedule.status];
    const cancelled = schedule.status === 'cancelled';

    return (
        <button
            type="button"
            onClick={() => onSelect(schedule)}
            className={cn(
                'w-full min-w-0 rounded-card bg-surface p-3 text-left shadow-e1',
                'transition duration-hover ease-out-expo hover:-translate-y-0.5 hover:shadow-e3 active:scale-[.97]',
                cancelled && 'opacity-60',
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-caption font-medium tabular-nums text-ink">
                    <Clock className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                    {formatTime(schedule.startAt)} · {schedule.durationMinutes} phút
                </span>
                {pillLabel && <Badge tone={statusTone('schedule', schedule.status).tone}>{pillLabel}</Badge>}
            </div>
            <p className="mt-2 truncate text-body-sm font-medium text-ink" title={candidateName}>{candidateName}</p>
            <p className="mt-0.5 truncate text-caption text-ink-3" title={jobTitle}>{jobTitle}</p>
            <div className="mt-2 flex items-center gap-3 text-caption text-ink-3">
                <span className="inline-flex shrink-0 items-center gap-1">
                    <TypeIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                    {online ? 'Trực tuyến' : 'Trực tiếp'}
                </span>
                <span className="inline-flex min-w-0 items-center gap-1">
                    <UserRound className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    <span className="truncate">{schedule.interviewer?.fullName ?? 'Interviewer'}</span>
                </span>
            </div>
        </button>
    );
}
