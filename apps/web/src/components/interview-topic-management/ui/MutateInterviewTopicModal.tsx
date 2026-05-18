'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ClipboardList, X } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';
import { IInterviewTopic } from '@/types/interfaces/interview.interface';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import {
    createInterviewTopicAction,
    InterviewTopicActionState,
    updateInterviewTopicAction,
} from '@/servers/interviews/interviews.action';
import { toast } from '@/lib/toast';

const initialState: InterviewTopicActionState = { success: false, message: '' };

interface MutateInterviewTopicModalProps {
    topic?: IInterviewTopic;
    jobCategories: IJobCategoryDto[];
    onClose: () => void;
}

export function MutateInterviewTopicModal({ topic, jobCategories, onClose }: MutateInterviewTopicModalProps) {
    const action = topic ? updateInterviewTopicAction : createInterviewTopicAction;
    const [state, dispatch, isPending] = useActionState(action, initialState);
    const [name, setName] = useState(topic?.name ?? '');
    const [categoryId, setCategoryId] = useState(topic?.categoryId ?? '');
    const nameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        nameRef.current?.focus();
    }, []);

    useEffect(() => {
        if (state.success && state.message) {
            toast.success('Thành công', state.message);
            onClose();
        } else if (state.message) {
            toast.error('Lỗi', state.message);
        }
    }, [state, onClose]);

    return (
        <AnimatePresence>
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
                onClick={onClose}
            >
                <motion.div
                    key="modal"
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="flex items-center justify-between border-b border-[#F2F2F7] px-6 py-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EBF3FD]">
                                <ClipboardList className="h-4 w-4 text-[#0071E3]" />
                            </div>
                            <h2 className="text-[18px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 700 }}>
                                {topic ? 'Chỉnh sửa chủ đề' : 'Thêm chủ đề phỏng vấn'}
                            </h2>
                        </div>
                        <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#AEAEB2] transition-colors hover:bg-[#F5F5F7]">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <form action={dispatch}>
                        <div className="space-y-4 px-6 py-5">
                            {!state.success && state.message && (
                                <div className="rounded-xl bg-[#FFE5E5] px-4 py-3 text-[13px] text-[#FF3B30]">
                                    {state.message}
                                </div>
                            )}

                            {topic && <input type="hidden" name="topicId" value={topic.topicId} />}

                            <div>
                                <label className="mb-2 block text-[13px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>
                                    Tên chủ đề <span className="text-[#FF3B30]">*</span>
                                </label>
                                <input
                                    ref={nameRef}
                                    type="text"
                                    name="name"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    required
                                    className="w-full rounded-xl border border-[#E5E5EA] px-4 py-3 text-[14px] outline-none transition-all focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10"
                                    placeholder="Ví dụ: Frontend React, Java Core, System Design"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-[13px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>
                                    Danh mục công việc
                                </label>
                                <select
                                    name="categoryId"
                                    value={categoryId}
                                    onChange={(event) => setCategoryId(event.target.value)}
                                    className="w-full rounded-xl border border-[#E5E5EA] bg-white px-4 py-3 text-[14px] outline-none transition-all focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10"
                                >
                                    <option value="">Không gắn danh mục</option>
                                    {jobCategories.map((category) => (
                                        <option key={category.categoryId} value={category.categoryId}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 border-t border-[#F2F2F7] px-6 py-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded-xl border border-[#E5E5EA] px-4 py-3 text-[14px] transition-colors hover:bg-[#F5F5F7]"
                                style={{ fontWeight: 600 }}
                            >
                                Hủy
                            </button>
                            <motion.button
                                type="submit"
                                whileTap={{ scale: 0.98 }}
                                disabled={isPending}
                                className="flex-1 rounded-xl bg-[#0071E3] px-4 py-3 text-[14px] text-white shadow-sm transition-colors hover:bg-[#0077ED] disabled:bg-[#E5E5EA] disabled:text-[#AEAEB2]"
                                style={{ fontWeight: 700 }}
                            >
                                {isPending ? 'Đang lưu...' : topic ? 'Lưu thay đổi' : 'Tạo chủ đề'}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}