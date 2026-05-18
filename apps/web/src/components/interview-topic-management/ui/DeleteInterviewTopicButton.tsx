'use client';

import { useActionState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteInterviewTopicAction, InterviewTopicActionState } from '@/servers/interviews/interviews.action';
import { toast } from '@/lib/toast';

const initialState: InterviewTopicActionState = { success: false, message: '' };

interface DeleteInterviewTopicButtonProps {
    topicId: string;
    disabled?: boolean;
}

export function DeleteInterviewTopicButton({ topicId, disabled }: DeleteInterviewTopicButtonProps) {
    const [state, dispatch, isPending] = useActionState(deleteInterviewTopicAction, initialState);

    useEffect(() => {
        if (state.success && state.message) {
            toast.success('Thành công', state.message);
        } else if (state.message) {
            toast.error('Lỗi', state.message);
        }
    }, [state]);

    return (
        <form
            action={dispatch}
            onSubmit={(event) => {
                if (!window.confirm('Bạn có chắc muốn xóa chủ đề phỏng vấn này?')) {
                    event.preventDefault();
                }
            }}
        >
            <input type="hidden" name="topicId" value={topicId} />
            <button
                type="submit"
                disabled={disabled || isPending}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#AEAEB2] transition-colors hover:bg-[#FFE5E5] hover:text-[#FF3B30] disabled:cursor-not-allowed disabled:opacity-40"
                title={disabled ? 'Không thể xóa chủ đề đã có phiên phỏng vấn' : 'Xóa'}
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </form>
    );
}