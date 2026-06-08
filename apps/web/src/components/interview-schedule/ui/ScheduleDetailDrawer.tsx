'use client';

import { useTransition } from 'react';
import { motion } from 'motion/react';
import { Ban, Building2, Briefcase, CalendarDays, CheckCircle2, Clock, RefreshCw, UserRound, X } from 'lucide-react';
import { IInterviewSchedule } from '@/types/interfaces/interview.interface';
import { cancelInterviewScheduleAction, completeInterviewScheduleAction } from '@/servers/interviews/interviews.action';
import { toast } from '@/lib/toast';
import { ScheduleStatus } from '@ats-platform/types';

interface ScheduleDetailDrawerProps {
    schedule: IInterviewSchedule;
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

export function ScheduleDetailDrawer({ schedule, onClose, onChanged, onReschedule }: ScheduleDetailDrawerProps) {
    const [isPending, startTransition] = useTransition();
    const candidate = schedule.application?.candidate;
    const candidateName = candidate?.user?.fullName ?? 'Ứng viên';
    const candidateEmail = candidate?.user?.email ?? 'Chưa có email';
    const jobTitle = schedule.application?.jobPosting?.title ?? 'Tin tuyển dụng';
    const departmentName = schedule.application?.jobPosting?.department?.name ?? 'Chưa có khoa';

    const items = [
        { icon: CalendarDays, label: 'Ngày phỏng vấn', value: formatDate(schedule.scheduledDate) },
        { icon: Clock, label: 'Giờ phỏng vấn', value: formatTime(schedule.scheduledTime) },
        { icon: UserRound, label: 'Người phỏng vấn', value: schedule.interviewer?.fullName ?? 'Chưa có' },
        { icon: Briefcase, label: 'Vị trí', value: jobTitle },
        { icon: Building2, label: 'Khoa', value: departmentName },
    ];

    const canMutate = schedule.status === ScheduleStatus.scheduled;

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
        <div className="fixed inset-0 z-40 flex justify-end bg-black/20" onClick={onClose}>
            <motion.aside
                initial={{ x: 360, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 360, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex h-full w-full max-w-[380px] flex-col bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-[#F2F2F7] px-5 py-4">
                    <div>
                        <h2 className="text-[16px] text-[#1D1D1F]" style={{ fontWeight: 800 }}>Chi tiết phỏng vấn</h2>
                        <p className="text-[12px] text-[#6E6E73]">{statusLabels[schedule.status] ?? schedule.status}</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#AEAEB2] transition-colors hover:bg-[#F5F5F7]">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0071E3] text-[15px] text-white" style={{ fontWeight: 800 }}>
                            {candidateName.split(' ').slice(-2).map((part) => part[0]).join('').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-[15px] text-[#1D1D1F]" style={{ fontWeight: 800 }}>{candidateName}</p>
                            <p className="truncate text-[12px] text-[#6E6E73]">{candidateEmail}</p>
                        </div>
                    </div>

                    <div className="mb-5 rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.06em] text-[#6E6E73]" style={{ fontWeight: 800 }}>Hình thức</p>
                        <p className="mt-1 text-[14px] text-[#1D1D1F]" style={{ fontWeight: 700 }}>Phỏng vấn trực tiếp</p>
                    </div>

                    <div className="space-y-3">
                        {items.map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-start gap-3 rounded-xl border border-[#F2F2F7] px-3 py-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EBF3FD]">
                                    <Icon className="h-4 w-4 text-[#0071E3]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] text-[#AEAEB2]">{label}</p>
                                    <p className="mt-0.5 text-[13px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-[#F2F2F7] p-5">
                    {canMutate && (
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleStatusChange(completeInterviewScheduleAction)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D1F0D7] px-3 py-3 text-[13px] text-[#248A3D] transition-colors hover:bg-[#F0FBF2] disabled:cursor-not-allowed disabled:opacity-60"
                                style={{ fontWeight: 800 }}
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Hoàn tất
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleStatusChange(cancelInterviewScheduleAction)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#FFD7D7] px-3 py-3 text-[13px] text-[#FF3B30] transition-colors hover:bg-[#FFF2F2] disabled:cursor-not-allowed disabled:opacity-60"
                                style={{ fontWeight: 800 }}
                            >
                                <Ban className="h-4 w-4" />
                                Hủy lịch
                            </button>
                        </div>
                    )}
                    <button
                        type="button"
                        disabled={!canMutate || isPending}
                        onClick={() => onReschedule(schedule)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0071E3] px-4 py-3 text-[14px] text-white shadow-sm transition-colors hover:bg-[#0077ED] disabled:cursor-not-allowed disabled:bg-[#E5E5EA] disabled:text-[#AEAEB2]"
                        style={{ fontWeight: 800 }}
                    >
                        <RefreshCw className="h-4 w-4" />
                        Đổi lịch
                    </button>
                </div>
            </motion.aside>
        </div>
    );
}
