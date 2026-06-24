'use client';

import { useActionState, useEffect, useState, type MouseEvent } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Save, Sparkles, X } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
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
}

export function MutateJobPostingModal({
    onClose,
    editingJob,
    skillsDb,
    categories,
    currentRecruiter,
}: MutateJobPostingModalProps) {
    const isEditing = !!editingJob;
    const [step, setStep] = useState<1 | 2>(isEditing ? 2 : 1);
    const [skills, setSkills] = useState<string[]>(
        editingJob?.jobPostingSkills?.map(item => item.skill.name) ?? []
    );
    const [isParsing, setIsParsing] = useState(false);
    const [selectedSkillToAdd, setSelectedSkillToAdd] = useState('');

    const parsedJobPosting = useJobPostingStore(state => state.parsedData);
    const setParsedData = useJobPostingStore(state => state.setParsedData);

    const rawDepartment = editingJob?.department ?? currentRecruiter?.department ?? null;
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
        if (editingJob?.parsedRequirements) {
            setParsedData(editingJob.parsedRequirements);
        }
    }, [editingJob?.parsedRequirements, setParsedData]);

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
    };

    const validateStepOne = () => {
        if (!lockedDepartment) {
            toast.error('Tài khoản recruiter chưa được gán khoa');
            return false;
        }

        if (!formData.title.trim()) {
            toast.error('Vui lòng điền tiêu đề vị trí');
            return false;
        }

        if (!formData.description.trim()) {
            toast.error('Vui lòng điền mô tả công việc');
            return false;
        }

        return true;
    };

    const handleParseClick = async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

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

    const handleSubmitClick = (event: MouseEvent<HTMLButtonElement>) => {
        if (!lockedDepartment) {
            event.preventDefault();
            toast.error('Tài khoản recruiter chưa được gán khoa');
        }
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

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={event => event.stopPropagation()}
                style={{ fontFamily: SFT }}
            >
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#F2F2F7]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0071E3] to-[#0056B3] flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-[20px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>
                                {isEditing ? 'Chỉnh sửa tin tuyển dụng' : `Tạo tin tuyển dụng (Bước ${step}/2)`}
                            </h2>
                            <p className="text-[12px] text-[#6E6E73]">
                                {step === 1 ? 'Điền thông tin cơ bản để AI phân tích' : 'Hoàn thiện thông tin và xuất bản'}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-[#F5F5F7] rounded-lg transition-colors flex-shrink-0">
                        <X className="w-4 h-4 text-[#6E6E73]" />
                    </button>
                </div>

                <form action={formAction} className="flex flex-col overflow-hidden">
                    {isEditing && <input type="hidden" name="jobId" value={editingJob.jobId} />}

                    <div className={step === 1 ? 'contents' : 'hidden'}>
                        <JobPostingStep1
                            formData={formData}
                            updateField={updateField}
                            department={lockedDepartment}
                        />
                    </div>

                    <div className={step === 2 ? 'contents' : 'hidden'}>
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

                    <div className="flex items-center justify-between px-6 py-4 border-t border-[#F2F2F7] bg-white">
                        {step === 2 && !isEditing ? (
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex items-center gap-2 px-5 py-2.5 text-[#6E6E73] hover:text-[#1D1D1F] transition-colors text-[14px]"
                                style={{ fontWeight: 500 }}
                            >
                                <ArrowLeft className="w-4 h-4" /> Quay lại
                            </button>
                        ) : (
                            <div />
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 border border-[#E5E5EA] hover:bg-[#F5F5F7] rounded-xl transition-colors text-[14px]"
                                style={{ fontWeight: 500 }}
                            >
                                Hủy
                            </button>

                            {step === 1 ? (
                                <button
                                    type="button"
                                    onClick={handleParseClick}
                                    disabled={isPending || isParsing || !lockedDepartment}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] disabled:bg-[#E5E5EA] disabled:text-[#AEAEB2] text-white rounded-xl transition-all shadow-sm text-[14px]"
                                    style={{ fontWeight: 600 }}
                                >
                                    {isPending || isParsing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang phân tích...
                                        </>
                                    ) : (
                                        <>
                                            Tiếp tục <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    onClick={handleSubmitClick}
                                    disabled={isPending || isParsing || !lockedDepartment}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] disabled:bg-[#E5E5EA] disabled:text-[#AEAEB2] text-white rounded-xl transition-all shadow-sm text-[14px]"
                                    style={{ fontWeight: 600 }}
                                >
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {isPending ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Xuất bản'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
