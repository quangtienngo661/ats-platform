'use client';

import { startTransition, useActionState, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteInterviewTopicAction, InterviewTopicActionState } from '@/servers/interviews/interviews.action';
import { toast } from '@/lib/toast';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { IconButton } from '@/components/ui';

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

interface DeleteInterviewTopicButtonProps {
    topicId: string;
    disabled?: boolean;
}

/** A stand-alone delete button with its own confirm dialog. The topic table uses the row menu and the dialog instead. */
export function DeleteInterviewTopicButton({ topicId, disabled }: DeleteInterviewTopicButtonProps) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    return (
        <>
            <IconButton
                size="sm"
                onClick={() => setIsConfirmOpen(true)}
                disabled={disabled}
                aria-label="Xóa chủ đề phỏng vấn"
                className="hover:text-danger"
                title={disabled ? 'Không thể xóa chủ đề đã có phiên phỏng vấn' : 'Xóa'}
            >
                <Trash2 aria-hidden="true" strokeWidth={1.75} />
            </IconButton>
            <DeleteInterviewTopicDialog topicId={topicId} open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} />
        </>
    );
}
