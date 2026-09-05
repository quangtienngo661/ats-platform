import { Clock, UserRound } from 'lucide-react';
import { IInterviewSchedule } from '@/types/interfaces/interview.interface';

interface ScheduleCardProps {
    schedule: IInterviewSchedule;
    onSelect: (schedule: IInterviewSchedule) => void;
}

function formatTime(value: string) {
    return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function ScheduleCard({ schedule, onSelect }: ScheduleCardProps) {
    const candidateName = schedule.application?.candidate?.user?.fullName ?? 'Ứng viên';
    const jobTitle = schedule.application?.jobPosting?.title ?? 'Tin tuyển dụng';

    return (
        <button
            type="button"
            onClick={() => onSelect(schedule)}
            className="w-full rounded-xl border border-[#BBD7F8] bg-[#EBF3FD] p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[#0071E3] hover:shadow-sm"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate text-[13px] text-[#1D1D1F]" style={{ fontWeight: 700 }}>{candidateName}</p>
                    <p className="mt-0.5 truncate text-[11px] text-[#6E6E73]">{jobTitle}</p>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-[#0071E3]" style={{ fontWeight: 700 }}>
                    Offline
                </span>
            </div>
            <div className="mt-3 flex items-center gap-3 text-[11px] text-[#6E6E73]">
                <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(schedule.startAt)} · {schedule.durationMinutes} phút
                </span>
                <span className="inline-flex min-w-0 items-center gap-1">
                    <UserRound className="h-3.5 w-3.5" />
                    <span className="truncate">{schedule.interviewer?.fullName ?? 'Interviewer'}</span>
                </span>
            </div>
        </button>
    );
}