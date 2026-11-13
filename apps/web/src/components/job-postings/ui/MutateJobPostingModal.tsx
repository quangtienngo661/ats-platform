'use client';

import { useActionState, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Button, Dialog, Field, Select } from '@/components/ui';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { toast } from '@/lib/toast';
import { JobPostingStep1 } from './JobPostingStep1';
import { JobPostingStep2 } from './JobPostingStep2';
import {
    ActionState,
    createJobPostingAction,
    parseJdPreviewAction,
    updateJobPostingAction,
} from '@/servers/job-postings/job-postings.action';
import { ISkillDto } from '@/types/interfaces/skill.interface';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';
import { useJobPostingStore } from '@/stores/useJobPostingStore';

interface MutateJobPostingModalProps {
    onClose: () => void;
    skillsDb: ISkillDto[];
    editingJob: IJobPostingDto | null;
    categories: IJobCategoryDto[];
    currentRecruiter: IRecruiterDto | null;
    recruiters?: IRecruiterDto[];
    userRole?: string;
}

type StepOneErrors = { title?: string; description?: string };

const STEPS = [
    { n: 1, label: 'Thông tin chung' },
    { n: 2, label: 'Mô tả và yêu cầu' },
] as const;

export function MutateJobPostingModal({
    onClose,
    editingJob,
    skillsDb,
    categories,
    currentRecruiter,
    recruiters = [],
    userRole,
}: MutateJobPostingModalProps) {
    const isEditing = !!editingJob;
    const [step, setStep] = useState<1 | 2>(isEditing ? 2 : 1);
    const [skills, setSkills] = useState<string[]>(
        editingJob?.jobPostingSkills?.map(item => item.skill.name) ?? []
    );
    const [isParsing, setIsParsing] = useState(false);
    const [selectedSkillToAdd, setSelectedSkillToAdd] = useState('');
    const [errors, setErrors] = useState<StepOneErrors>({});

    const parsedJobPosting = useJobPostingStore(state => state.parsedData);
    const setParsedData = useJobPostingStore(state => state.setParsedData);

    const manager = userRole === 'admin' || userRole === 'org_admin';
    const owners = recruiters.filter(recruiter => recruiter.user?.role === 'recruiter' && recruiter.user?.status === 'active');
    const [ownerId, setOwnerId] = useState(editingJob?.recruiter?.recruiterId ?? currentRecruiter?.recruiterId ?? '');
    const rawDepartment = editingJob?.department ?? (manager ? owners.find(owner => owner.recruiterId === ownerId)?.department : currentRecruiter?.department) ?? null;
    const lockedDepartment = rawDepartment?.departmentId && rawDepartment?.name
        ? { departmentId: rawDepartment.departmentId, name: rawDepartment.name }
        : null;

    const [formData, setFormData] = useState({
        title: editingJob?.title || '',
        departmentId: lockedDepartment?.departmentId || '',
        locationType: editingJob?.locationType || 'onsite',
        description: editingJob?.description || '',
        categoryId: editingJob?.category?.categoryId || '',
        salaryMin: editingJob?.salaryMin?.toString() || '',
        salaryMax: editingJob?.salaryMax?.toString() || '',
        status: editingJob?.status || 'draft',
    });

    const [state, formAction, isPending] = useActionState(
        isEditing ? updateJobPostingAction : createJobPostingAction,
        { success: false, message: '' } as ActionState<IJobPostingDto>
    );

    useEffect(() => {
        if (!editingJob) setParsedData(null);
        if (editingJob?.parsedRequirements) {
            setParsedData(editingJob.parsedRequirements);
        }
    }, [editingJob, setParsedData]);

    useEffect(() => {
        if (!state?.message) return;

        if (!state.success) {
            setIsParsing(false);
            toast.error(state.message);
            return;
        }

        toast.success(state.message);
        onClose();
    }, [state, onClose, setParsedData]);

    const updateField = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        if (key === 'title' || key === 'description') setErrors(prev => ({ ...prev, [key]: undefined }));
    };

    const validateStepOne = () => {
        if (!lockedDepartment) return false;

        const next: StepOneErrors = {};
        if (!formData.title.trim()) next.title = 'Nhập tiêu đề vị trí.';
        if (!formData.description.trim()) next.description = 'Nhập mô tả công việc.';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleParseClick = async () => {
        if (!validateStepOne()) {
            return;
        }

        setIsParsing(true);

        const result = await parseJdPreviewAction(formData.description);
        setIsParsing(false);

        if (!result.success || !result.data) {
            toast.error(result.message);
            return;
        }

        setParsedData(result.data);
        setSkills(result.data.requirements?.hard_skills ?? []);
        setStep(2);
        toast.success(result.message);
    };

    const handleAddExistingSkill = () => {
        if (!selectedSkillToAdd) return;

        const dbSkill = skillsDb.find(skill => skill.skillId === selectedSkillToAdd);
        if (dbSkill && !skills.some(skill => skill === dbSkill.name)) {
            setSkills(prev => [...prev, dbSkill.name]);
        }

        setSelectedSkillToAdd('');
    };

    const removeSkill = (skillToRemove: string) => {
        setSkills(prev => prev.filter(skill => skill !== skillToRemove));
    };

    const formId = 'job-posting-form';
    const busy = isPending || isParsing;

    return (
        <Dialog
            open
            onOpenChange={open => { if (!open && !isPending) onClose(); }}
            title={isEditing ? 'Sửa tin tuyển dụng' : 'Tạo tin tuyển dụng'}
            size="lg"
            footer={
                <>
                    {step === 2 && !isEditing ? (
                        <Button variant="secondary" onClick={() => setStep(1)} disabled={busy} className="mr-auto">
                            Quay lại
                        </Button>
                    ) : null}
                    <Button variant="ghost" onClick={onClose} disabled={isPending}>
                        Hủy
                    </Button>
                    {step === 1 ? (
                        <>
                            <Button
                                variant="secondary"
                                disabled={busy || !lockedDepartment}
                                onClick={() => { if (validateStepOne()) { setParsedData(null); setStep(2); } }}
                            >
                                Tiếp tục không dùng AI
                            </Button>
                            <Button onClick={handleParseClick} loading={busy} disabled={!lockedDepartment}>
                                {busy ? 'Đang phân tích…' : 'Tiếp tục'}
                            </Button>
                        </>
                    ) : (
                        <Button type="submit" form={formId} loading={isPending} disabled={isParsing || !lockedDepartment}>
                            {isPending ? 'Đang lưu…' : 'Lưu tin'}
                        </Button>
                    )}
                </>
            }
        >
            <ol className="mb-5 flex items-center gap-3" aria-label="Các bước">
                {STEPS.map(({ n, label }, i) => {
                    const current = step === n;
                    const done = !current && (step > n || (isEditing && n === 1));
                    return (
                        <li
                            key={n}
                            data-step={n}
                            aria-current={current ? 'step' : undefined}
                            className={`flex min-w-0 items-center gap-2 text-body-sm ${current ? 'font-medium text-ink' : 'text-ink-3'}`}
                        >
                            <span
                                aria-hidden="true"
                                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-caption tabular-nums ${
                                    current ? 'bg-ink text-surface' : done ? 'bg-accent-soft text-accent-text' : 'bg-surface-2 text-ink-3'
                                }`}
                            >
                                {done ? <Check strokeWidth={2} className="size-3.5" /> : n}
                            </span>
                            <span className="truncate">{label}</span>
                            {i < STEPS.length - 1 ? <span aria-hidden="true" className="ml-1 h-px w-8 bg-line-strong" /> : null}
                        </li>
                    );
                })}
            </ol>

            <form id={formId} action={formAction} className="space-y-5">
                {!isEditing && <input type="hidden" name="createdBy" value={ownerId} />}
                {manager && !isEditing && (
                    <Field
                        label="Người phụ trách"
                        required
                        error={owners.length === 0 ? 'Cần thêm recruiter vào phòng ban trước khi tạo tin.' : undefined}
                    >
                        {f => (
                            <Select {...f} value={ownerId} onChange={event => setOwnerId(event.target.value)}>
                                <option value="">Chọn recruiter phụ trách</option>
                                {owners.map(owner => (
                                    <option key={owner.recruiterId} value={owner.recruiterId}>
                                        {owner.user?.fullName} · {owner.user?.email} · {owner.department?.name}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>
                )}
                {isEditing && <input type="hidden" name="jobId" value={editingJob.jobId} />}

                <div className={step === 1 ? 'block' : 'hidden'}>
                    <JobPostingStep1
                        formData={formData}
                        updateField={updateField}
                        department={lockedDepartment}
                        errors={errors}
                    />
                </div>

                <div className={step === 2 ? 'block' : 'hidden'}>
                    <JobPostingStep2
                        formData={formData}
                        updateField={updateField}
                        parsedJobPosting={parsedJobPosting}
                        isParsing={isParsing}
                        skills={skills}
                        skillsDb={skillsDb}
                        categories={categories}
                        removeSkill={removeSkill}
                        selectedSkillToAdd={selectedSkillToAdd}
                        setSelectedSkillToAdd={setSelectedSkillToAdd}
                        handleAddExistingSkill={handleAddExistingSkill}
                    />
                </div>
            </form>
        </Dialog>
    );
}
