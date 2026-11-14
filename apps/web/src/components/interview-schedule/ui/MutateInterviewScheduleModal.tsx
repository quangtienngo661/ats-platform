'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Button, Dialog, Field, Input, Select } from '@/components/ui';
import { cn } from '@/components/ui/cn';
import { IApplicationDto } from '@/types/interfaces/application.interface';
import { IInterviewSchedule } from '@/types/interfaces/interview.interface';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';
import {
    createInterviewScheduleAction,
    InterviewScheduleActionState,
    updateInterviewScheduleAction,
} from '@/servers/interviews/interviews.action';
import { toast } from '@/lib/toast';
import { localDateTimeToIso } from '@/lib/interview-time';

const initialState: InterviewScheduleActionState = { success: false, message: '' };

type InterviewTypeValue = 'onsite' | 'online';
const INTERVIEW_TYPES: { value: InterviewTypeValue; label: string }[] = [
    { value: 'onsite', label: 'Trực tiếp' },
    { value: 'online', label: 'Trực tuyến' },
];

interface MutateInterviewScheduleModalProps {
    schedule?: IInterviewSchedule;
    applications: IApplicationDto[];
    interviewers: IRecruiterDto[];
    currentRecruiter: IRecruiterDto | null;
    userRole?: string;
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

function formatInputDate(value?: string) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function candidateLabel(application: IApplicationDto) {
    const candidateName = application.candidate?.user?.fullName ?? 'Ứng viên';
    const jobTitle = application.jobPosting?.title ?? 'Tin tuyển dụng';
    return `${candidateName} - ${jobTitle}`;
}

const FORM_ID = 'mutate-interview-schedule-form';

export function MutateInterviewScheduleModal({
    schedule,
    applications,
    interviewers,
    currentRecruiter,
    userRole,
    defaultDate,
    minDate,
    onClose,
}: MutateInterviewScheduleModalProps) {
    const action = schedule ? updateInterviewScheduleAction : createInterviewScheduleAction;
    const [state, dispatch, isPending] = useActionState(action, initialState);

    const [applicationId, setApplicationId] = useState(schedule?.applicationId ?? applications[0]?.applicationId ?? '');
    const selectedApplication = schedule?.application ?? applications.find(item => item.applicationId === applicationId) ?? null;
    const organizationId = selectedApplication?.jobPosting?.organizationId ?? selectedApplication?.jobPosting?.department?.organizationId;
    const eligible = interviewers.filter(recruiter => recruiter.user?.role === 'recruiter' && recruiter.user?.status === 'active' &&
        (userRole !== 'admin' || (!!organizationId && recruiter.department?.organizationId === organizationId)));
    const [interviewerId, setInterviewerId] = useState(schedule?.interviewerId ?? currentRecruiter?.user?.userId ?? '');
    const effectiveInterviewerId = eligible.some(recruiter => recruiter.user?.userId === interviewerId) ? interviewerId : eligible[0]?.user?.userId ?? '';
    const disabled = isPending || (!schedule && applications.length === 0) || eligible.length === 0;
    // Converted here, in the browser, because only the browser knows the timezone the
    // recruiter typed the time in; the server action runs wherever it is deployed.
    const [scheduledDate, setScheduledDate] = useState(schedule?.startAt ? formatInputDate(schedule.startAt) : defaultDate);
    const [scheduledTime, setScheduledTime] = useState(formatInputTime(schedule?.startAt));
    const [interviewType, setInterviewType] = useState<InterviewTypeValue>(
        schedule?.interviewType === 'online' ? 'online' : 'onsite',
    );
    // Controlled: React resets uncontrolled fields after every form action, a refused one included.
    const [durationMinutes, setDurationMinutes] = useState(String(schedule?.durationMinutes ?? 60));
    const [location, setLocation] = useState(schedule?.location ?? '');
    const [onlineMeetingLink, setOnlineMeetingLink] = useState(schedule?.onlineMeetingLink ?? '');

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
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !isPending) onClose();
            }}
            title={schedule ? 'Đổi lịch phỏng vấn' : 'Đặt phỏng vấn'}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button type="submit" form={FORM_ID} disabled={disabled}>
                        {isPending ? 'Đang lưu…' : schedule ? 'Lưu lịch mới' : 'Đặt lịch'}
                    </Button>
                </>
            }
        >
            <form id={FORM_ID} action={dispatch} className="space-y-4">
                {!state.success && state.message && (
                    <div className="rounded-ctl bg-danger-soft px-3 py-2 text-body-sm text-danger">
                        {state.message}
                    </div>
                )}

                {schedule && <input type="hidden" name="interviewId" value={schedule.interviewId} />}

                {schedule && selectedApplication ? (
                    <div className="flex flex-col gap-1.5">
                        <p className="text-body-sm font-medium text-ink">Ứng viên</p>
                        <input type="hidden" name="applicationId" value={schedule.applicationId} />
                        <div className="break-words rounded-ctl bg-surface-2 px-3 py-2 text-body-sm text-ink">
                            {candidateLabel(selectedApplication)}
                        </div>
                    </div>
                ) : (
                    <Field label="Ứng viên" required>
                        {(f) => (
                            <Select
                                {...f}
                                name="applicationId"
                                value={applicationId}
                                onChange={event => { setApplicationId(event.target.value); setInterviewerId(''); }}
                            >
                                {applications.length === 0 ? (
                                    <option value="">Chưa có ứng viên ở vòng phỏng vấn</option>
                                ) : applications.map((application) => (
                                    <option key={application.applicationId} value={application.applicationId}>
                                        {candidateLabel(application)}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>
                )}

                <Field label="Người phỏng vấn" required>
                    {(f) => (
                        <Select
                            {...f}
                            name="interviewerId"
                            value={effectiveInterviewerId}
                            onChange={event => setInterviewerId(event.target.value)}
                        >
                            {eligible.length === 0 ? (
                                <option value="">Chưa có recruiter phù hợp trong tổ chức</option>
                            ) : eligible.map((recruiter) => (
                                <option key={recruiter.recruiterId} value={recruiter.user?.userId ?? ''}>
                                    {recruiter.user?.fullName ?? 'Recruiter'}{recruiter.position ? ` - ${recruiter.position}` : ''}
                                </option>
                            ))}
                        </Select>
                    )}
                </Field>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Ngày phỏng vấn" required>
                        {(f) => (
                            <Input
                                {...f}
                                type="date"
                                name="scheduledDate"
                                value={scheduledDate}
                                onChange={event => setScheduledDate(event.target.value)}
                                min={minDate}
                                className="tabular-nums"
                            />
                        )}
                    </Field>
                    <Field label="Giờ phỏng vấn" required>
                        {(f) => (
                            <Input
                                {...f}
                                type="time"
                                name="scheduledTime"
                                value={scheduledTime}
                                onChange={event => setScheduledTime(event.target.value)}
                                className="tabular-nums"
                            />
                        )}
                    </Field>
                </div>
                <input type="hidden" name="startAt" value={localDateTimeToIso(scheduledDate, scheduledTime) ?? ''} />

                <Field label="Thời lượng (phút)" required>
                    {(f) => (
                        <Input
                            {...f}
                            type="number"
                            name="durationMinutes"
                            value={durationMinutes}
                            onChange={event => setDurationMinutes(event.target.value)}
                            min={15}
                            max={480}
                            step={15}
                            className="tabular-nums"
                        />
                    )}
                </Field>

                <fieldset>
                    <legend className="mb-1.5 text-body-sm font-medium text-ink">Hình thức</legend>
                    <div className="grid grid-cols-2 gap-2">
                        {INTERVIEW_TYPES.map(option => (
                            <label
                                key={option.value}
                                className={cn(
                                    'flex h-9 cursor-pointer items-center gap-2 rounded-ctl px-3 text-body-sm transition-colors duration-hover',
                                    interviewType === option.value
                                        ? 'bg-accent-soft text-accent-text'
                                        : 'bg-surface-2 text-ink-2 hover:text-ink',
                                )}
                            >
                                <input
                                    type="radio"
                                    name="interviewType"
                                    value={option.value}
                                    checked={interviewType === option.value}
                                    onChange={() => setInterviewType(option.value)}
                                    className="accent-accent"
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                </fieldset>

                {interviewType === 'onsite' ? (
                    <Field label="Địa điểm" required>
                        {(f) => (
                            <Input
                                {...f}
                                type="text"
                                name="location"
                                value={location}
                                onChange={event => setLocation(event.target.value)}
                                maxLength={255}
                                placeholder="Ví dụ: Tầng 5, 123 Lê Lợi, Quận 1"
                            />
                        )}
                    </Field>
                ) : (
                    <Field label="Đường dẫn phòng họp" required>
                        {(f) => (
                            <Input
                                {...f}
                                type="url"
                                name="onlineMeetingLink"
                                value={onlineMeetingLink}
                                onChange={event => setOnlineMeetingLink(event.target.value)}
                                placeholder="https://meet.google.com/..."
                            />
                        )}
                    </Field>
                )}
            </form>
        </Dialog>
    );
}
