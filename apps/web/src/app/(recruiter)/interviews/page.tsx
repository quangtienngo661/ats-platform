import InterviewScheduleClient from '@/components/interview-schedule/InterviewScheduleClient';
import {
    getMyInterviewSchedulesAction,
    getSchedulableInterviewApplicationsAction,
} from '@/servers/interviews/interviews.action';
import { getMyRecruiterProfileAction, getRecruitersAction } from '@/servers/recruiters/recruiters.action';

interface InterviewSchedulePageProps {
    searchParams: Promise<{ weekStart?: string }>;
}

function startOfWorkWeek(date: Date) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
}

function addDays(date: Date, amount: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    return result;
}

function toDateInputValue(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseWeekStart(value: string | undefined) {
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    return startOfWorkWeek(parsed);
}

function getMinimumVisibleWeek(today: Date) {
    const currentWeekStart = startOfWorkWeek(today);
    const currentFriday = addDays(currentWeekStart, 4);
    currentFriday.setHours(23, 59, 59, 999);

    if (today.getTime() > currentFriday.getTime()) {
        return addDays(currentWeekStart, 7);
    }

    return currentWeekStart;
}

export default async function InterviewSchedulePage({ searchParams }: InterviewSchedulePageProps) {
    const params = await searchParams;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minWeekStart = getMinimumVisibleWeek(today);
    const requestedWeekStart = parseWeekStart(params.weekStart);
    const selectedWeekStart = requestedWeekStart && requestedWeekStart >= minWeekStart
        ? requestedWeekStart
        : minWeekStart;

    const selectedWeekEnd = addDays(selectedWeekStart, 4);
    const fromDate = selectedWeekStart.getTime() === startOfWorkWeek(today).getTime() && today <= selectedWeekEnd
        ? toDateInputValue(today)
        : toDateInputValue(selectedWeekStart);

    const [schedules, applications, recruiters, currentRecruiter] = await Promise.all([
        getMyInterviewSchedulesAction({
            fromDate,
            toDate: toDateInputValue(selectedWeekEnd),
            limit: 100,
        }),
        getSchedulableInterviewApplicationsAction(),
        getRecruitersAction(),
        getMyRecruiterProfileAction(),
    ]);

    const departmentId = currentRecruiter?.department?.departmentId;
    const departmentRecruiters = departmentId
        ? recruiters.filter((recruiter) => recruiter.user?.userId && recruiter.department?.departmentId === departmentId)
        : [];

    return (
        <InterviewScheduleClient
            schedules={schedules.data}
            applications={applications}
            interviewers={departmentRecruiters}
            currentRecruiter={currentRecruiter}
            selectedWeekStart={toDateInputValue(selectedWeekStart)}
            minWeekStart={toDateInputValue(minWeekStart)}
            today={toDateInputValue(today)}
        />
    );
}