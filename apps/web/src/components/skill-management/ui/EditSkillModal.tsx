'use client';

import { useEffect, useRef, useActionState, useState } from 'react';
import { X, Pencil } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';
import { motion, AnimatePresence } from 'motion/react';
import { updateSkillAction, SkillActionState } from '@/servers/skills/skills.action';
import { ISkillDto } from '@/types/interfaces/skill.interface';
import { toast } from '@/lib/toast';

interface EditSkillModalProps {
    skill: ISkillDto;
    existingCategories: string[];
    onClose: () => void;
}

const initialState: SkillActionState = { success: false, message: '' };

export function EditSkillModal({ skill, existingCategories, onClose }: EditSkillModalProps) {
    const [state, dispatch, isPending] = useActionState(updateSkillAction, initialState);

    // Track inputs to determine isDirty
    const [name, setName] = useState(skill.name);
    const [category, setCategory] = useState(skill.category ?? '');
    const isDirty = name !== skill.name || (category || '') !== (skill.category ?? '');

    const nameRef = useRef<HTMLInputElement>(null);

    useEffect(() => { nameRef.current?.focus(); }, []);

    // Watch state to handle success/error
    useEffect(() => {
        if (state.success && state.data) {
            toast.success('Thành công', state.message);
            onClose();
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
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#EBF3FD] flex items-center justify-center">
                                <Pencil className="w-4 h-4 text-[#0071E3]" />
                            </div>
                            <h2 className="text-[18px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>
                                Chỉnh sửa kỹ năng
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg text-[#AEAEB2] hover:bg-[#F5F5F7] transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <form action={dispatch}>
                        <div className="p-6 space-y-4">
                            {!state.success && state.message && (
                                <div className="px-4 py-3 rounded-xl bg-[#FFE5E5] text-[#FF3B30] text-[13px]" style={{ fontFamily: SF }}>
                                    {state.message}
                                </div>
                            )}

                            {/* Hidden field to pass skillId */}
                            <input type="hidden" name="skillId" value={skill.skillId} />

                            <div>
                                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                                    Tên kỹ năng <span className="text-[#FF3B30]">*</span>
                                </label>
                                <input
                                    ref={nameRef}
                                    type="text"
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]"
                                    style={{ fontFamily: SF }}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                                    Danh mục <span className="text-[#AEAEB2] font-normal">(tùy chọn)</span>
                                </label>
                                <input
                                    type="text"
                                    name="category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    list="edit-category-suggestions"
                                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]"
                                    style={{ fontFamily: SF }}
                                />
                                <datalist id="edit-category-suggestions">
                                    {existingCategories.map((cat) => <option key={cat} value={cat} />)}
                                </datalist>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-[#F2F2F7] flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[14px]"
                                style={{ fontWeight: 500 }}
                            >
                                Hủy
                            </button>
                            <motion.button
                                type="submit"
                                disabled={isPending || !isDirty}
                                whileTap={{ scale: 0.97 }}
                                className="flex-1 px-4 py-3 bg-[#0071E3] hover:bg-[#0077ED] disabled:bg-[#E5E5EA] disabled:text-[#AEAEB2] text-white rounded-xl transition-all shadow-sm text-[14px]"
                                style={{ fontWeight: 600 }}
                            >
                                {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
