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
        { label: 'Lịch trong tuần', value: schedules.length },
        { label: 'Đang chờ', value: scheduled },
        { label: 'Đã hoàn tất', value: completed },
        { label: 'Ứng viên chờ lịch', value: applications.length },
        { label: 'Interviewer', value: interviewers.length },
    ];

    return (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-3 sm:grid-cols-3 lg:grid-cols-5 lg:px-6">
            {stats.map((item) => (
                <div key={item.label} className="min-w-0">
                    <dt className="truncate text-caption text-ink-3">{item.label}</dt>
                    <dd className="mt-0.5 text-title font-semibold tabular-nums text-ink">{item.value}</dd>
                </div>
            ))}
        </dl>
    );
}
