'use client';

import { startTransition, useActionState, useEffect } from 'react';
import { deleteInterviewTopicAction, InterviewTopicActionState } from '@/servers/interviews/interviews.action';
import { toast } from '@/lib/toast';
import { ConfirmModal } from '@/components/common/ConfirmModal';

const initialState: InterviewTopicActionState = { success: false, message: '' };

interface DeleteInterviewTopicDialogProps {
    topicId: string;
    open: boolean;
    onClose: () => void;
}

/** The confirm dialog and the delete action. Keep it mounted: the action state lives here. */
export function DeleteInterviewTopicDialog({ topicId, open, onClose }: DeleteInterviewTopicDialogProps) {
    const [state, dispatch, isPending] = useActionState(deleteInterviewTopicAction, initialState);

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
        onClose();
        startTransition(() => dispatch(formData));
    };

    return (
        <ConfirmModal
            isOpen={open}
            title="Xóa chủ đề phỏng vấn"
            description="Bạn có chắc muốn xóa chủ đề phỏng vấn này? Thao tác này không thể hoàn tác."
            confirmText="Xóa"
            isConfirming={isPending}
            onConfirm={confirmDelete}
            onCancel={onClose}
        />
    );
}
