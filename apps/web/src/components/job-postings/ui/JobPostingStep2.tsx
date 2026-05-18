import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import { IParsedJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { ISkillDto } from '@/types/interfaces/skill.interface';
import { Info, Loader2, Plus, Sparkles, X } from 'lucide-react';

interface JobPostingStep2Props {
    formData: {
        categoryId: string;
        status: string;
        salaryMin: string;
        salaryMax: string;
    };
    updateField: (key: string, value: string) => void;
    parsedJobPosting: IParsedJobPostingDto | null;
    isParsing: boolean;
    skills: string[];
    skillsDb: ISkillDto[];
    categories: IJobCategoryDto[];
    removeSkill: (skill: string) => void;
    selectedSkillToAdd: string;
    setSelectedSkillToAdd: (val: string) => void;
    handleAddExistingSkill: () => void;
}

export function JobPostingStep2({
    formData,
    updateField,
    parsedJobPosting,
    isParsing,
    skills,
    skillsDb,
    categories,
    removeSkill,
    selectedSkillToAdd,
    setSelectedSkillToAdd,
    handleAddExistingSkill,
}: JobPostingStep2Props) {
    const validSkills = skills
        .map(skill => {
            const dbSkill = skillsDb.find(db => db.name.toLowerCase() === skill.toLowerCase());
            return dbSkill ? { skillId: dbSkill.skillId, isRequired: true } : null;
        })
        .filter((skill): skill is { skillId: string; isRequired: boolean } => Boolean(skill));

    return (
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <input type="hidden" name="skills" value={JSON.stringify(validSkills)} />
            <input type="hidden" name="parsedRequirements" value={JSON.stringify(parsedJobPosting ?? {})} />

            <div className="bg-[#F5F5F7] rounded-2xl p-5 border border-[#E5E5EA]">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#0071E3]" />
                    <h3 className="text-[14px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>Yêu cầu kỹ năng (AI trích xuất)</h3>
                </div>

                {isParsing ? (
                    <div className="flex flex-col items-center justify-center py-6 text-[#6E6E73]">
                        <Loader2 className="w-6 h-6 animate-spin mb-3 text-[#0071E3]" />
                        <p className="text-[13px]">Đang phân tích mô tả công việc...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {skills.map(skill => {
                                const isValid = skillsDb.some(db => db.name.toLowerCase() === skill.toLowerCase());

                                return (
                                    <div key={skill} className="relative group">
                                        <div className={`flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg border text-[13px] ${isValid ? 'bg-[#EBF3FD] border-[#0071E3]/20 text-[#0071E3]' : 'bg-[#FEF2F2] border-red-500/20 text-red-600'}`}>
                                            <span style={{ fontWeight: 500, textDecoration: isValid ? 'none' : 'line-through' }}>{skill}</span>
                                            <button type="button" onClick={() => removeSkill(skill)} className="p-1 hover:bg-black/5 rounded-md transition-colors ml-1">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        {!isValid && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-[#1D1D1F] text-white text-[11px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1.5 shadow-lg z-10">
                                                <Info className="w-3.5 h-3.5" />
                                                Kỹ năng này chưa có trong hệ thống và sẽ không được lưu.
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {skills.length === 0 && (
                                <p className="text-[13px] text-[#AEAEB2] italic">Không tìm thấy kỹ năng nào.</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-[#E5E5EA]">
                            <select
                                value={selectedSkillToAdd}
                                onChange={event => setSelectedSkillToAdd(event.target.value)}
                                className="px-5 py-2 rounded-xl border border-[#E5E5EA] text-[13px] outline-none focus:border-[#0071E3] bg-white min-w-[200px] appearance-none cursor-pointer"
                            >
                                <option value="">-- Chọn kỹ năng để thêm --</option>
                                {skillsDb
                                    .filter(dbSkill => !skills.some(skill => skill.toLowerCase() === dbSkill.name.toLowerCase()))
                                    .map(dbSkill => (
                                        <option key={dbSkill.skillId} value={dbSkill.skillId}>{dbSkill.name}</option>
                                    ))}
                            </select>
                            <button
                                type="button"
                                onClick={handleAddExistingSkill}
                                disabled={!selectedSkillToAdd}
                                className="p-2 bg-[#F5F5F7] text-[#0071E3] rounded-xl hover:bg-[#EBF3FD] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Danh mục công việc</label>
                    <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={event => updateField('categoryId', event.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] outline-none transition-all text-[14px]"
                    >
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map(category => (
                            <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Trạng thái</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={event => updateField('status', event.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] outline-none transition-all text-[14px]"
                    >
                        <option value="draft">Bản nháp</option>
                        <option value="active">Đang tuyển</option>
                        <option value="closed">Đã đóng</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Mức lương từ</label>
                    <input
                        type="number"
                        name="salaryMin"
                        placeholder="2000"
                        value={formData.salaryMin}
                        onChange={event => updateField('salaryMin', event.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] outline-none transition-all text-[14px]"
                    />
                </div>
                <div>
                    <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Mức lương đến</label>
                    <input
                        type="number"
                        name="salaryMax"
                        placeholder="4000"
                        value={formData.salaryMax}
                        onChange={event => updateField('salaryMax', event.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] outline-none transition-all text-[14px]"
                    />
                </div>
            </div>
        </div>
    );
}
