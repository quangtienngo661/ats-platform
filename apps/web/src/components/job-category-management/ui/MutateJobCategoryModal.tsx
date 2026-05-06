'use client';

import { useState, useActionState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { motion, AnimatePresence } from 'motion/react';
import SubmitButton from '@/components/common/SubmitButton';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import { createJobCategoryAction, updateJobCategoryAction } from '@/servers/job-categories/job-categories.action';
import { toast } from '@/lib/toast';

interface MutateJobCategoryModalProps {
    onClose: () => void;
    editingCategory: IJobCategoryDto | null;
    parentCategories: IJobCategoryDto[];
}

type ActionState = { success: boolean; message: string };
const initialState: ActionState = { success: false, message: '' };

export function MutateJobCategoryModal({ onClose, editingCategory, parentCategories }: MutateJobCategoryModalProps) {
    const isEditing = !!(editingCategory?.categoryId);
    const isAddingChild = !isEditing && !!editingCategory?.parentCategoryId;

    const [parentId, setParentId] = useState<string>(
        editingCategory?.parentCategoryId || ''
    );

    const performAction = isEditing ? updateJobCategoryAction : createJobCategoryAction;

    const [state, formAction] = useActionState(performAction, initialState);

    useEffect(() => {
        if (state.success) {
            const timer = setTimeout(() => onClose(), 300);
            toast.success(state.message)
            return () => clearTimeout(timer);
        }
    }, [state.success, onClose]);

    // Determine modal title
    let title = 'Thêm danh mục mới';
    if (isEditing) title = 'Cập nhật danh mục';
    else if (isAddingChild) {
        const parent = parentCategories.find((c) => c.categoryId === editingCategory?.parentCategoryId);
        title = `Thêm danh mục con — ${parent?.name || ''}`;
    }

    return (
        <AnimatePresence>
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    key="modal"
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[#F2F2F7]">
                        <h2
                            className="text-[20px] text-[#1D1D1F] tracking-[-0.01em]"
                            style={{ fontFamily: SF, fontWeight: 600 }}
                        >
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-[#AEAEB2] hover:bg-[#F5F5F7] transition-colors"
                            type="button"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Form */}
                    <form action={formAction}>
                        {/* Hidden fields */}
                        {isEditing && editingCategory?.categoryId && (
                            <input type="hidden" name="categoryId" value={editingCategory.categoryId} />
                        )}
                        <input type="hidden" name="parentCategoryId" value={parentId} />

                        <div className="p-6 space-y-4">
                            {/* Category name */}
                            <div>
                                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                                    Tên danh mục <span className="text-[#FF3B30]">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="Ví dụ: Công nghệ thông tin"
                                    defaultValue={isEditing ? (editingCategory?.name ?? '') : ''}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/10 outline-none transition-all text-[14px]"
                                />
                            </div>

                            {/* Parent category selector */}
                            {!isAddingChild && (
                                <div>
                                    <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                                        Danh mục cha
                                    </label>
                                    <select
                                        value={parentId}
                                        onChange={(e) => setParentId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/10 outline-none transition-all text-[14px] bg-white appearance-none"
                                        style={{ fontFamily: SFT }}
                                    >
                                        <option value="">— Không (danh mục gốc) —</option>
                                        {parentCategories
                                            .filter(cat => !cat.parentCategoryId)
                                            .map((cat) => <option
                                                key={cat.categoryId}
                                                value={cat.categoryId}
                                                disabled={isEditing && cat.categoryId === editingCategory?.categoryId}
                                            >
                                                {cat.name}
                                            </option>)
                                        }
                                    </select>
                                    <p className="text-[11px] text-[#AEAEB2] mt-1.5">
                                        Để trống nếu đây là danh mục cấp cao nhất
                                    </p>
                                </div>
                            )}

                            {/* Error message */}
                            {state.message && !state.success && (
                                <div className="px-4 py-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
                                    <p className="text-[13px] text-[#DC2626]">{state.message}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-[#F2F2F7] flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 mt-[3px] py-3 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[14px] text-[#1D1D1F]"
                                style={{ fontWeight: 500 }}
                            >
                                Hủy
                            </button>
                            <div className="flex-1">
                                <SubmitButton content={isEditing ? 'Cập nhật' : 'Tạo danh mục'} />
                            </div>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
