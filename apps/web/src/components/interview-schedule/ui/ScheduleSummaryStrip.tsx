import { IApplicationDto } from '@/types/interfaces/application.interface';
import { IInterviewSchedule } from '@/types/interfaces/interview.interface';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';

interface ScheduleSummaryStripProps {
    schedules: IInterviewSchedule[];
    applications: IApplicationDto[];
    interviewers: IRecruiterDto[];
}

export function ScheduleSummaryStrip({ schedules: s, applications: a, interviewers: iv }: ScheduleSummaryStripProps) {
    const schedules = s ?? [];
    const applications = a ?? [];
    const interviewers = iv ?? [];
    const scheduled = schedules.filter((schedule) => schedule.status === 'scheduled').length;
    const completed = schedules.filter((schedule) => schedule.status === 'completed').length;

    const stats = [
        { label: 'Lịch trong tuần', value: schedules.length, color: '#0071E3', bg: '#EBF3FD' },
        { label: 'Đang chờ', value: scheduled, color: '#D97706', bg: '#FFFBEB' },
        { label: 'Đã hoàn tất', value: completed, color: '#16A34A', bg: '#F0FDF4' },
        { label: 'Ứng viên chờ lịch', value: applications.length, color: '#7C3AED', bg: '#F5F3FF' },
        { label: 'Interviewer', value: interviewers.length, color: '#0F766E', bg: '#ECFDF5' },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 border-b border-[#F2F2F7] bg-white px-4 py-3 lg:grid-cols-5 lg:px-6">
            {stats.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: item.bg }}>
                        <span className="text-[14px]" style={{ color: item.color, fontWeight: 800 }}>{item.value}</span>
                    </div>
                    <span className="text-[12px] text-[#6E6E73]">{item.label}</span>
                </div>
            ))}
        </div>
    );
}