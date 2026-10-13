import { Clock, MapPin, UserRound, Video } from 'lucide-react';
import { IInterviewSchedule } from '@/types/interfaces/interview.interface';

interface ScheduleCardProps {
    schedule: IInterviewSchedule;
    onSelect: (schedule: IInterviewSchedule) => void;
}

function formatTime(value: string) {
    return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/** Card colour follows the schedule status; only finished or cancelled cards carry a status pill. */
const statusStyle: Record<string, { card: string; time: string; pill?: { label: string; className: string } }> = {
    scheduled: { card: 'border-[#BBD7F8] bg-white hover:border-[#0071E3]', time: 'text-[#0071E3]' },
    completed: {
        card: 'border-[#BBF7D0] bg-[#F0FDF4] hover:border-[#16A34A]',
        time: 'text-[#16A34A]',
        pill: { label: 'Hoàn tất', className: 'bg-white text-[#16A34A]' },
    },
    cancelled: {
        card: 'border-[#E5E5EA] bg-[#F5F5F7] opacity-70 hover:border-[#AEAEB2]',
        time: 'text-[#6E6E73]',
        pill: { label: 'Đã hủy', className: 'bg-white text-[#6E6E73]' },
    },
};

export function ScheduleCard({ schedule, onSelect }: ScheduleCardProps) {
    const candidateName = schedule.application?.candidate?.user?.fullName ?? 'Ứng viên';
    const jobTitle = schedule.application?.jobPosting?.title ?? 'Tin tuyển dụng';
    const online = schedule.interviewType === 'online';
    const TypeIcon = online ? Video : MapPin;
    const style = statusStyle[schedule.status] ?? statusStyle.scheduled;

    return (
        <button
            type="button"
            onClick={() => onSelect(schedule)}
            className={`w-full rounded-xl border p-3 text-left shadow-[0_1px_2px_rgba(24,24,27,0.04),0_4px_10px_-4px_rgba(24,24,27,0.08)] transition-all hover:-translate-y-0.5 ${style.card}`}
        >
            <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1 text-[12px] ${style.time}`} style={{ fontWeight: 600 }}>
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatTime(schedule.startAt)} · {schedule.durationMinutes} phút
                </span>
                {style.pill && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${style.pill.className}`} style={{ fontWeight: 600 }}>
                        {style.pill.label}
                    </span>
                )}
            </div>
            <p className="mt-2 truncate text-[13px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>{candidateName}</p>
            <p className="mt-0.5 truncate text-[11px] text-[#6E6E73]">{jobTitle}</p>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-[#6E6E73]">
                <span className="inline-flex items-center gap-1">
                    <TypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {online ? 'Trực tuyến' : 'Trực tiếp'}
                </span>
                <span className="inline-flex min-w-0 items-center gap-1">
                    <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="truncate">{schedule.interviewer?.fullName ?? 'Interviewer'}</span>
                </span>
            </div>
        </button>
    );
}
