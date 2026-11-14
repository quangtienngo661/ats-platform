import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import { IParsedJobPostingDto } from '@/types/interfaces/job-posting.interface';
import { ISkillDto } from '@/types/interfaces/skill.interface';
import { LoaderCircle, Plus, X } from 'lucide-react';
import { Field, Input, Select, Surface } from '@/components/ui';

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
        .map((skill) => {
            const dbSkill = skillsDb.find((db) => db.name.toLowerCase() === skill.toLowerCase());
            return dbSkill ? { skillId: dbSkill.skillId, isRequired: true } : null;
        })
        .filter((skill): skill is { skillId: string; isRequired: boolean } => Boolean(skill));

    return (
        <div className="space-y-5">
            <input type="hidden" name="skills" value={JSON.stringify(validSkills)} />
            <input type="hidden" name="parsedRequirements" value={JSON.stringify(parsedJobPosting ?? {})} />

            <Surface variant="inset" className="p-4">
                <h3 className="mb-3 text-body-sm font-semibold text-ink">Yêu cầu kỹ năng</h3>

                {isParsing ? (
                    <div role="status" className="flex items-center gap-2 py-4 text-body-sm text-ink-3">
                        <LoaderCircle aria-hidden="true" strokeWidth={1.75} className="size-4 animate-spin" />
                        Đang phân tích mô tả công việc…
                    </div>
                ) : (
                    <div className="space-y-3">
                        <ul className="flex flex-wrap gap-2">
                            {skills.map((skill) => {
                                const isValid = skillsDb.some((db) => db.name.toLowerCase() === skill.toLowerCase());
                                return (
                                    <li
                                        key={skill}
                                        title={isValid ? undefined : 'Kỹ năng này chưa có trong hệ thống và sẽ không được lưu.'}
                                        className={`flex items-center gap-1 rounded-ctl py-0.5 pl-2.5 pr-1 text-body-sm ${
                                            isValid ? 'bg-accent-soft text-accent-text' : 'bg-danger-soft text-danger'
                                        }`}
                                    >
                                        <span className={isValid ? '' : 'line-through'}>{skill}</span>
                                        {!isValid && <span className="sr-only">Chưa có trong hệ thống</span>}
                                        <button
                                            aria-label="Đóng"
                                            type="button"
                                            onClick={() => removeSkill(skill)}
                                            className="rounded-ctl p-1 hover:bg-ink/5"
                                        >
                                            <X aria-hidden="true" strokeWidth={1.75} className="size-3.5" />
                                        </button>
                                    </li>
                                );
                            })}
                            {skills.length === 0 && <li className="text-body-sm text-ink-3">Không tìm thấy kỹ năng nào.</li>}
                        </ul>

                        <div className="flex items-center gap-2 border-t border-line pt-3">
                            <Select
                                aria-label="Chọn kỹ năng cần thêm"
                                className="min-w-0 flex-1 sm:max-w-64"
                                value={selectedSkillToAdd}
                                onChange={(event) => setSelectedSkillToAdd(event.target.value)}
                            >
                                <option value="">Chọn kỹ năng để thêm</option>
                                {skillsDb
                                    .filter((dbSkill) => !skills.some((skill) => skill.toLowerCase() === dbSkill.name.toLowerCase()))
                                    .map((dbSkill) => (
                                        <option key={dbSkill.skillId} value={dbSkill.skillId}>
                                            {dbSkill.name}
                                        </option>
                                    ))}
                            </Select>
                            <button
                                aria-label="Thêm"
                                type="button"
                                onClick={handleAddExistingSkill}
                                disabled={!selectedSkillToAdd}
                                className="flex size-9 shrink-0 items-center justify-center rounded-ctl bg-surface text-ink shadow-e2 transition duration-press active:scale-[.97] hover:bg-surface-2 disabled:pointer-events-none disabled:text-ink-4"
                            >
                                <Plus aria-hidden="true" strokeWidth={1.75} className="size-4" />
                            </button>
                        </div>
                    </div>
                )}
            </Surface>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Danh mục công việc">
                    {(f) => (
                        <Select
                            {...f}
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={(event) => updateField('categoryId', event.target.value)}
                        >
                            <option value="">Chọn danh mục</option>
                            {categories.map((category) => (
                                <option key={category.categoryId} value={category.categoryId}>
                                    {category.name}
                                </option>
                            ))}
                        </Select>
                    )}
                </Field>
                <Field label="Trạng thái">
                    {(f) => (
                        <Select
                            {...f}
                            name="status"
                            value={formData.status}
                            onChange={(event) => updateField('status', event.target.value)}
                        >
                            <option value="draft">Bản nháp</option>
                            <option value="active">Đang tuyển</option>
                            <option value="closed">Đã đóng</option>
                        </Select>
                    )}
                </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Mức lương từ (VNĐ)">
                    {(f) => (
                        <Input
                            {...f}
                            type="number"
                            name="salaryMin"
                            placeholder="15000000"
                            min={0}
                            className="tabular-nums"
                            value={formData.salaryMin}
                            onChange={(event) => updateField('salaryMin', event.target.value)}
                        />
                    )}
                </Field>
                <Field label="Mức lương đến (VNĐ)">
                    {(f) => (
                        <Input
                            {...f}
                            type="number"
                            name="salaryMax"
                            placeholder="25000000"
                            min={0}
                            className="tabular-nums"
                            value={formData.salaryMax}
                            onChange={(event) => updateField('salaryMax', event.target.value)}
                        />
                    )}
                </Field>
            </div>
            <p className="text-caption text-ink-3">Nhập số tiền đầy đủ theo VNĐ, ví dụ 15000000 cho 15 triệu.</p>
        </div>
    );
}
