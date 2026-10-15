'use client';

import { startTransition, useActionState, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteInterviewTopicAction, InterviewTopicActionState } from '@/servers/interviews/interviews.action';
import { toast } from '@/lib/toast';
import { ConfirmModal } from '@/components/common/ConfirmModal';

const initialState: InterviewTopicActionState = { success: false, message: '' };

interface DeleteInterviewTopicButtonProps {
    topicId: string;
    disabled?: boolean;
}

export function DeleteInterviewTopicButton({ topicId, disabled }: DeleteInterviewTopicButtonProps) {
    const [state, dispatch, isPending] = useActionState(deleteInterviewTopicAction, initialState);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        if (state.success && state.message) {
            toast.success('Thành công', state.message);
        } else if (state.message) {
            toast.error('Lỗi', state.message);
        }
    }, [state]);

    const confirmDelete = () => {
        const formData = new FormData();
        formData.set('topicId', topicId);
        setIsConfirmOpen(false);
        startTransition(() => dispatch(formData));
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                disabled={disabled || isPending}
                aria-label="Xóa chủ đề phỏng vấn"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#AEAEB2] transition-colors hover:bg-[#FFE5E5] hover:text-[#FF3B30] disabled:cursor-not-allowed disabled:opacity-40"
                title={disabled ? 'Không thể xóa chủ đề đã có phiên phỏng vấn' : 'Xóa'}
            >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
            <ConfirmModal
                isOpen={isConfirmOpen}
                title="Xóa chủ đề phỏng vấn"
                description="Bạn có chắc muốn xóa chủ đề phỏng vấn này? Thao tác này không thể hoàn tác."
                confirmText="Xóa"
                isConfirming={isPending}
                onConfirm={confirmDelete}
                onCancel={() => setIsConfirmOpen(false)}
            />
        </>
    );
}
