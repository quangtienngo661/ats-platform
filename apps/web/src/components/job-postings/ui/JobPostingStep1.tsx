import { RichTextEditor } from '@/components/common/RichTextEditor';
import { Field, Input, Select } from '@/components/ui';
import { WORK_TYPE_LABELS } from '@/lib/work-types';

interface JobPostingStep1Props {
    formData: {
        title: string;
        departmentId: string;
        locationType: string;
        description: string;
    };
    updateField: (key: string, value: string) => void;
    department?: {
        departmentId: string;
        name: string;
    } | null;
    /** Inline validation messages by field. */
    errors?: { title?: string; description?: string };
}

export function JobPostingStep1({ formData, updateField, department, errors = {} }: JobPostingStep1Props) {
    return (
        <div className="space-y-5">
            <input type="hidden" name="departmentId" value={department?.departmentId ?? formData.departmentId} />

            <Field label="Tiêu đề vị trí" required error={errors.title}>
                {(f) => (
                    <Input
                        {...f}
                        type="text"
                        name="title"
                        placeholder="Ví dụ: Senior Frontend Developer"
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                    />
                )}
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-body-sm font-medium text-ink">Phòng ban phụ trách</span>
                    <div
                        className="flex h-9 items-center truncate rounded-ctl bg-surface-2 px-3 text-body-sm text-ink"
                        title={department?.name}
                    >
                        {department?.name ?? 'Chưa chọn recruiter phụ trách'}
                    </div>
                    {!department && (
                        <p className="text-caption text-danger">Chọn recruiter có phòng ban để tạo tin tuyển dụng.</p>
                    )}
                </div>
                <Field label="Hình thức" required>
                    {(f) => (
                        <Select
                            {...f}
                            name="locationType"
                            value={formData.locationType}
                            onChange={(e) => updateField('locationType', e.target.value)}
                        >
                            <option value="onsite">{WORK_TYPE_LABELS.onsite}</option>
                            <option value="remote">{WORK_TYPE_LABELS.remote}</option>
                            <option value="hybrid">{WORK_TYPE_LABELS.hybrid}</option>
                        </Select>
                    )}
                </Field>
            </div>

            <Field
                label="Mô tả công việc"
                required
                hint="AI dùng mô tả này để trích xuất kỹ năng ở bước sau."
                error={errors.description}
            >
                {(f) => (
                    <div className="rounded-ctl border border-line-strong bg-surface">
                        <RichTextEditor
                            id={f.id}
                            ariaLabel="Mô tả công việc"
                            placeholder="Nhập mô tả công việc, quyền lợi và yêu cầu."
                            value={formData.description || ''}
                            onChange={(val) => updateField('description', val)}
                        />
                    </div>
                )}
            </Field>
            <input type="hidden" name="description" value={formData.description} />
        </div>
    );
}
