'use client';

import { useState, useEffect, useActionState } from 'react';
import { X, Save, Sparkles, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { toast } from '@/lib/toast';
import { JobPostingStep1 } from './JobPostingStep1';
import { JobPostingStep2 } from './JobPostingStep2';
import { createJobPostingAction, updateJobPostingAction, JobPostingActionState } from '@/servers/job-postings/job-postings.action';

interface MutateJobPostingModalProps {
    onClose: () => void;
    editingJob: IJobPostingDto | null;
}

export function MutateJobPostingModal({ onClose, editingJob }: MutateJobPostingModalProps) {
    const isEditing = !!editingJob;
    const [step, setStep] = useState<1 | 2>(isEditing ? 2 : 1);

    const [state, formAction, isPending] = useActionState(
        isEditing ? updateJobPostingAction : createJobPostingAction,
        { success: false, message: '' } as JobPostingActionState
    );

    useEffect(() => {
        if (state && state.message) {
            if (state.success) {
                toast.success(state.message);
                onClose();
            } else {
                toast.error(state.message);
            }
        }
    }, [state, onClose]);

    // Mock data for dropdowns. TODO: Fetch from actual APIs
    const mockDepartments = [
        { id: 'dept-eng', name: 'Engineering' },
        { id: 'dept-product', name: 'Product' },
        { id: 'dept-design', name: 'Design' },
        { id: 'dept-hr', name: 'Nhân sự' }
    ];

    const mockCategories = [
        { id: 'cat-it', name: 'Công nghệ thông tin' },
        { id: 'cat-pm', name: 'Quản lý sản phẩm' },
        { id: 'cat-design', name: 'Thiết kế' },
        { id: 'cat-ds', name: 'Khoa học dữ liệu' }
    ];

    const mockSkillsDb = [
        { id: 'skill-react', name: 'ReactJS' },
        { id: 'skill-node', name: 'Node.js' },
        { id: 'skill-ts', name: 'TypeScript' },
        { id: 'skill-nest', name: 'NestJS' },
        { id: 'skill-aws', name: 'AWS' },
        { id: 'skill-docker', name: 'Docker' },
    ];

    const [formData, setFormData] = useState({
        title: editingJob?.title || '',
        departmentId: editingJob?.department?.departmentId || mockDepartments[0].id,
        locationType: editingJob?.locationType || 'onsite',
        description: editingJob?.description || '',
        categoryId: editingJob?.category?.categoryId || '',
        salaryMin: editingJob?.salaryMin?.toString() || '',
        salaryMax: editingJob?.salaryMax?.toString() || '',
        status: editingJob?.status || 'draft',
    });

    const [skills, setSkills] = useState<{ id: string; name: string; isRequired: boolean }[]>(
        editingJob?.jobPostingSkills?.map(s => ({
            id: s.skill.skillId,
            name: s.skill.name,
            isRequired: s.isRequired
        })) || []
    );

    const [isParsing, setIsParsing] = useState(false);
    const [selectedSkillToAdd, setSelectedSkillToAdd] = useState('');

    const updateField = (key: string, value: string) =>
        setFormData(prev => ({ ...prev, [key]: value }));

    const handleNext = () => {
        if (!formData.title.trim()) {
            toast.error("Vui lòng điền tiêu đề vị trí");
            return;
        }
        if (!formData.description.trim()) {
            toast.error("Vui lòng điền mô tả công việc");
            return;
        }

        setStep(2);

        // Mô phỏng AI đang phân tích nếu chưa có skills
        if (!isEditing && skills.length === 0) {
            setIsParsing(true);
            setTimeout(() => {
                setSkills([
                    { id: 'skill-react', name: 'ReactJS', isRequired: true }, // valid
                    { id: 'skill-ts', name: 'TypeScript', isRequired: true }, // valid
                    { id: 's3', name: 'BunJS', isRequired: false }, // invalid (not in db)
                    { id: 's4', name: 'Agile', isRequired: false }  // invalid
                ]);
                setIsParsing(false);
                toast.success('AI đã trích xuất kỹ năng thành công');
            }, 3500);
        }
    };

    const handleAddExistingSkill = () => {
        if (!selectedSkillToAdd) return;
        const dbSkill = mockSkillsDb.find(s => s.id === selectedSkillToAdd);
        if (dbSkill && !skills.some(s => s.id === dbSkill.id)) {
            setSkills(prev => [...prev, { id: dbSkill.id, name: dbSkill.name, isRequired: false }]);
        }
        setSelectedSkillToAdd('');
    };

    const removeSkill = (idToRemove: string) => {
        setSkills(prev => prev.filter(s => s.id !== idToRemove));
    };

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
                style={{ fontFamily: SFT }}
            >
                {/* Header */}
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
                    {/* Hidden input for jobId when updating */}
                    {isEditing && <input type="hidden" name="jobId" value={editingJob.jobId} />}

                    <div className={step === 1 ? 'contents' : 'hidden'}>
                        <JobPostingStep1
                            formData={formData}
                            updateField={updateField}
                            mockDepartments={mockDepartments}
                        />
                    </div>

                    <div className={step === 2 ? 'contents' : 'hidden'}>
                        <JobPostingStep2
                            formData={formData}
                            updateField={updateField}
                            isParsing={isParsing}
                            skills={skills}
                            mockSkillsDb={mockSkillsDb}
                            mockCategories={mockCategories}
                            removeSkill={removeSkill}
                            selectedSkillToAdd={selectedSkillToAdd}
                            setSelectedSkillToAdd={setSelectedSkillToAdd}
                            handleAddExistingSkill={handleAddExistingSkill}
                        />
                    </div>

                    {/* Footer */}
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
                            <div /> // Spacer
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
                                    onClick={handleNext}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl transition-all shadow-sm text-[14px]"
                                    style={{ fontWeight: 600 }}
                                >
                                    Tiếp tục <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isPending || isParsing}
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
