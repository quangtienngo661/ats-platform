'use client';

import { useTransition } from 'react';
import { Ban, Building2, Briefcase, CalendarDays, CheckCircle2, Clock, RefreshCw, UserRound } from 'lucide-react';
import { Avatar, Badge, Button, ButtonLink, Sheet } from '@/components/ui';
import { statusTone } from '@/lib/status-tones';
import { IInterviewSchedule } from '@/types/interfaces/interview.interface';
import { cancelInterviewScheduleAction, completeInterviewScheduleAction } from '@/servers/interviews/interviews.action';
import { toast } from '@/lib/toast';
import { isHttpUrl } from '@/lib/meeting-link';
import { ScheduleStatus } from '@ats-platform/types';

interface ScheduleDetailDrawerProps {
    schedule: IInterviewSchedule;
    currentUserId: string;
    onClose: () => void;
    onChanged: () => void;
    onReschedule: (schedule: IInterviewSchedule) => void;
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(value: string) {
    return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

const statusLabels: Record<string, string> = {
    scheduled: 'Đã lên lịch',
    completed: 'Đã hoàn tất',
    cancelled: 'Đã hủy',
};

export function ScheduleDetailDrawer({ schedule, currentUserId, onClose, onChanged, onReschedule }: ScheduleDetailDrawerProps) {
    const [isPending, startTransition] = useTransition();
    const candidate = schedule.application?.candidate;
    const candidateName = candidate?.user?.fullName ?? 'Ứng viên';
    const candidateEmail = candidate?.user?.email ?? 'Chưa có email';
    const jobTitle = schedule.application?.jobPosting?.title ?? 'Tin tuyển dụng';
    const departmentName = schedule.application?.jobPosting?.department?.name ?? 'Chưa có khoa';

    const items = [
        { icon: CalendarDays, label: 'Ngày phỏng vấn', value: formatDate(schedule.startAt) },
        { icon: Clock, label: 'Giờ phỏng vấn', value: formatTime(schedule.startAt) },
        { icon: Clock, label: 'Thời lượng', value: `${schedule.durationMinutes} phút` },
        { icon: UserRound, label: 'Người phỏng vấn', value: schedule.interviewer?.fullName ?? 'Chưa có' },
        { icon: Briefcase, label: 'Vị trí', value: jobTitle },
        { icon: Building2, label: 'Khoa', value: departmentName },
    ];

    const canMutate = schedule.status === ScheduleStatus.scheduled;
    const isOnline = schedule.interviewType === 'online';

    const handleStatusChange = (action: (interviewId: string) => Promise<{ success: boolean; message: string }>) => {
        startTransition(async () => {
            const result = await action(schedule.interviewId);
            if (result.success) {
                toast.success('Thành công', result.message);
                onChanged();
                return;
            }

            toast.error('Lỗi', result.message);
        });
    };

    return (
        <Sheet
            open
            onOpenChange={(open) => {
                if (!open && !isPending) onClose();
            }}
            title="Chi tiết phỏng vấn"
        >
            <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                    <Avatar name={candidateName} size={40} />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-body-sm font-medium text-ink" title={candidateName}>{candidateName}</p>
                        <p className="truncate text-caption text-ink-3" title={candidateEmail}>{candidateEmail}</p>
                    </div>
                    <Badge tone={statusTone('schedule', schedule.status).tone}>
                        {statusLabels[schedule.status] ?? schedule.status}
                    </Badge>
                </div>

                <div className="rounded-card bg-surface-2 px-4 py-3">
                    <p className="text-caption text-ink-3">Hình thức</p>
                    <p className="mt-1 text-body-sm font-medium text-ink">
                        {isOnline ? 'Phỏng vấn trực tuyến' : 'Phỏng vấn trực tiếp'}
                    </p>
                    <div className="mt-1 break-all text-body-sm text-ink-2">
                        {isOnline
                            ? schedule.onlineMeetingLink && (isHttpUrl(schedule.onlineMeetingLink) ? (
                                <a
                                    href={schedule.onlineMeetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent-text hover:underline"
                                >
                                    {schedule.onlineMeetingLink}
                                </a>
                            ) : <span>{schedule.onlineMeetingLink}</span>)
                            : <span>{schedule.location ?? 'Chưa có địa điểm'}</span>}
                    </div>
                </div>

                <dl className="divide-y divide-line">
                    {items.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-start gap-3 py-3">
                            <Icon className="mt-0.5 size-4 shrink-0 text-ink-3" strokeWidth={1.75} aria-hidden="true" />
                            <div className="min-w-0">
                                <dt className="text-caption text-ink-3">{label}</dt>
                                <dd className="mt-0.5 break-words text-body-sm font-medium tabular-nums text-ink">{value}</dd>
                            </div>
                        </div>
                    ))}
                </dl>

                <div className="flex flex-col gap-2">
                    {schedule.status === ScheduleStatus.completed && schedule.interviewerId === currentUserId && (
                        <ButtonLink
                            href={`/jobs/${schedule.application.jobPosting?.jobId}/candidates/${schedule.applicationId}?tab=evaluation`}
                            variant="secondary"
                            size="lg"
                        >
                            Đánh giá
                        </ButtonLink>
                    )}
                    {canMutate && (
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="secondary"
                                disabled={isPending}
                                onClick={() => handleStatusChange(completeInterviewScheduleAction)}
                            >
                                <CheckCircle2 aria-hidden="true" strokeWidth={1.75} />
                                Hoàn tất
                            </Button>
                            <Button
                                variant="danger"
                                disabled={isPending}
                                onClick={() => handleStatusChange(cancelInterviewScheduleAction)}
                            >
                                <Ban aria-hidden="true" strokeWidth={1.75} />
                                Hủy lịch
                            </Button>
                        </div>
                    )}
                    <Button disabled={!canMutate || isPending} onClick={() => onReschedule(schedule)}>
                        <RefreshCw aria-hidden="true" strokeWidth={1.75} />
                        Đổi lịch
                    </Button>
                </div>
            </div>
        </Sheet>
    );
}
