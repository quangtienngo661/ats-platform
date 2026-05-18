import { RichTextEditor } from '@/components/common/RichTextEditor';

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
}

export function JobPostingStep1({ formData, updateField, department }: JobPostingStep1Props) {
    return (
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <input type="hidden" name="departmentId" value={department?.departmentId ?? formData.departmentId} />

            <div>
                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Tiêu đề vị trí *</label>
                <input
                    type="text"
                    name="title"
                    placeholder="Ví dụ: Senior Frontend Developer"
                    value={formData.title}
                    onChange={e => updateField('title', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Khoa phụ trách *</label>
                    <div className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] text-[14px] text-[#1D1D1F]">
                        {department?.name ?? 'Tài khoản recruiter chưa được gán khoa'}
                    </div>
                    {!department && (
                        <p className="mt-2 text-[12px] text-red-600">
                            Vui lòng liên hệ quản trị viên để gán khoa trước khi tạo tin tuyển dụng.
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Hình thức *</label>
                    <select
                        name="locationType"
                        value={formData.locationType}
                        onChange={e => updateField('locationType', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] outline-none transition-all text-[14px]"
                    >
                        <option value="onsite">Onsite</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Mô tả công việc *</label>
                <RichTextEditor
                    placeholder="Nhập chi tiết mô tả công việc, quyền lợi, yêu cầu... để AI có thể phân tích chính xác nhất."
                    value={formData.description || ''}
                    onChange={val => updateField('description', val)}
                />
                <input type="hidden" name="description" value={formData.description} />
            </div>
        </div>
    );
}
