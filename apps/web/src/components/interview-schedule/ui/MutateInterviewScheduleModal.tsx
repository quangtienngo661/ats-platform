'use client';

import { useActionState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarPlus, X } from 'lucide-react';
import { IApplicationDto } from '@/types/interfaces/application.interface';
import { IInterviewSchedule } from '@/types/interfaces/interview.interface';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';
import {
    createInterviewScheduleAction,
    InterviewScheduleActionState,
    updateInterviewScheduleAction,
} from '@/servers/interviews/interviews.action';
import { SF } from '@/types/fonts/fonts';
import { toast } from '@/lib/toast';

const initialState: InterviewScheduleActionState = { success: false, message: '' };

interface MutateInterviewScheduleModalProps {
    schedule?: IInterviewSchedule;
    applications: IApplicationDto[];
    interviewers: IRecruiterDto[];
    currentRecruiter: IRecruiterDto | null;
    defaultDate: string;
    minDate: string;
    onClose: () => void;
}

function formatInputTime(value?: string) {
    if (!value) return '09:00';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '09:00';
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function candidateLabel(application: IApplicationDto) {
    const candidateName = application.candidate?.user?.fullName ?? 'Ứng viên';
    const jobTitle = application.jobPosting?.title ?? 'Tin tuyển dụng';
    return `${candidateName} - ${jobTitle}`;
}

export function MutateInterviewScheduleModal({
    schedule,
    applications,
    interviewers,
    currentRecruiter,
    defaultDate,
    minDate,
    onClose,
}: MutateInterviewScheduleModalProps) {
    const action = schedule ? updateInterviewScheduleAction : createInterviewScheduleAction;
    const [state, dispatch, isPending] = useActionState(action, initialState);

    const selectedApplication = useMemo(() => {
        if (!schedule) return null;
        return schedule.application ?? applications.find((item) => item.applicationId === schedule.applicationId) ?? null;
    }, [applications, schedule]);

    const defaultInterviewerId = schedule?.interviewerId
        ?? currentRecruiter?.user?.userId
        ?? interviewers[0]?.user?.userId
        ?? '';

    const disabled = isPending || (!schedule && applications.length === 0) || interviewers.length === 0;

    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (state.success && state.message) {
            toast.success('Thành công', state.message);
            onCloseRef.current();
        } else if (state.message) {
            toast.error('Lỗi', state.message);
        }
    }, [state]);

    return (
        <AnimatePresence>
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
                onClick={onClose}
            >
                <motion.div
                    key="modal"
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="flex items-center justify-between border-b border-[#F2F2F7] px-6 py-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EBF3FD]">
                                <CalendarPlus className="h-4 w-4 text-[#0071E3]" />
                            </div>
                            <h2 className="text-[18px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 800 }}>
                                {schedule ? 'Đổi lịch phỏng vấn' : 'Đặt phỏng vấn'}
                            </h2>
                        </div>
                        <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#AEAEB2] transition-colors hover:bg-[#F5F5F7]">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <form action={dispatch}>
                        <div className="space-y-4 px-6 py-5">
                            {!state.success && state.message && (
                                <div className="rounded-xl bg-[#FFE5E5] px-4 py-3 text-[13px] text-[#FF3B30]">
                                    {state.message}
                                </div>
                            )}

                            {schedule && <input type="hidden" name="interviewId" value={schedule.interviewId} />}

                            <div>
                                <label className="mb-2 block text-[13px] text-[#1D1D1F]" style={{ fontWeight: 700 }}>
                                    Ứng viên
                                </label>
                                {schedule && selectedApplication ? (
                                    <>
                                        <input type="hidden" name="applicationId" value={schedule.applicationId} />
                                        <div className="rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] px-4 py-3 text-[14px] text-[#1D1D1F]">
                                            {candidateLabel(selectedApplication)}
                                        </div>
                                    </>
                                ) : (
                                    <select
                                        name="applicationId"
                                        required
                                        className="w-full rounded-xl border border-[#E5E5EA] bg-white px-4 py-3 text-[14px] outline-none transition-all focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10"
                                    >
                                        {applications.length === 0 ? (
                                            <option value="">Chưa có ứng viên ở vòng phỏng vấn</option>
                                        ) : applications.map((application) => (
                                            <option key={application.applicationId} value={application.applicationId}>
                                                {candidateLabel(application)}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-[13px] text-[#1D1D1F]" style={{ fontWeight: 700 }}>
                                    Người phỏng vấn
                                </label>
                                <select
                                    name="interviewerId"
                                    defaultValue={defaultInterviewerId}
                                    required
                                    className="w-full rounded-xl border border-[#E5E5EA] bg-white px-4 py-3 text-[14px] outline-none transition-all focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10"
                                >
                                    {interviewers.length === 0 ? (
                                        <option value="">Chưa có recruiter cùng khoa</option>
                                    ) : interviewers.map((recruiter) => (
                                        <option key={recruiter.recruiterId} value={recruiter.user?.userId ?? ''}>
                                            {recruiter.user?.fullName ?? 'Recruiter'}{recruiter.position ? ` - ${recruiter.position}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-[13px] text-[#1D1D1F]" style={{ fontWeight: 700 }}>
                                        Ngày phỏng vấn
                                    </label>
                                    <input
                                        type="date"
                                        name="scheduledDate"
                                        defaultValue={defaultDate}
                                        min={minDate}
                                        required
                                        className="w-full rounded-xl border border-[#E5E5EA] px-4 py-3 text-[14px] outline-none transition-all focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-[13px] text-[#1D1D1F]" style={{ fontWeight: 700 }}>
                                        Giờ phỏng vấn
                                    </label>
                                    <input
                                        type="time"
                                        name="scheduledTime"
                                        defaultValue={formatInputTime(schedule?.scheduledTime)}
                                        required
                                        className="w-full rounded-xl border border-[#E5E5EA] px-4 py-3 text-[14px] outline-none transition-all focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10"
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] px-4 py-3">
                                <p className="text-[11px] uppercase tracking-[0.06em] text-[#6E6E73]" style={{ fontWeight: 800 }}>Hình thức</p>
                                <p className="mt-1 text-[14px] text-[#1D1D1F]" style={{ fontWeight: 700 }}>Phỏng vấn trực tiếp</p>
                            </div>
                        </div>

                        <div className="flex gap-3 border-t border-[#F2F2F7] px-6 py-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded-xl border border-[#E5E5EA] px-4 py-3 text-[14px] transition-colors hover:bg-[#F5F5F7]"
                                style={{ fontWeight: 700 }}
                            >
                                Hủy
                            </button>
                            <motion.button
                                type="submit"
                                whileTap={{ scale: 0.98 }}
                                disabled={disabled}
                                className="flex-1 rounded-xl bg-[#0071E3] px-4 py-3 text-[14px] text-white shadow-sm transition-colors hover:bg-[#0077ED] disabled:bg-[#E5E5EA] disabled:text-[#AEAEB2]"
                                style={{ fontWeight: 800 }}
                            >
                                {isPending ? 'Đang lưu...' : schedule ? 'Lưu lịch mới' : 'Đặt lịch'}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}