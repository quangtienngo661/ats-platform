'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { IInterviewTopic } from '@/types/interfaces/interview.interface';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import {
    createInterviewTopicAction,
    InterviewTopicActionState,
    updateInterviewTopicAction,
} from '@/servers/interviews/interviews.action';
import { Button, Dialog, Field, Input, Select } from '@/components/ui';
import { toast } from '@/lib/toast';

const initialState: InterviewTopicActionState = { success: false, message: '' };

const FORM_ID = 'mutate-interview-topic-form';

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

    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (state.success && state.message) {
            toast.success('Thành công', state.message);
            onCloseRef.current();
        } else if (state.message) {
            toast.error('Lỗi', state.message);
        }
    }, [state]);

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !isPending) onClose();
            }}
            title={topic ? 'Chỉnh sửa chủ đề' : 'Thêm chủ đề phỏng vấn'}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button type="submit" form={FORM_ID} loading={isPending}>
                        {isPending ? 'Đang lưu…' : topic ? 'Lưu thay đổi' : 'Tạo chủ đề'}
                    </Button>
                </>
            }
        >
            <form id={FORM_ID} action={dispatch} className="space-y-4">
                {!state.success && state.message && (
                    <p role="alert" className="rounded-ctl bg-danger-soft px-3 py-2 text-body-sm text-danger">
                        {state.message}
                    </p>
                )}

                {topic && <input type="hidden" name="topicId" value={topic.topicId} />}

                <Field label="Tên chủ đề" required>
                    {(f) => (
                        <Input
                            {...f}
                            type="text"
                            name="name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Ví dụ: Frontend React, Java Core, System Design"
                        />
                    )}
                </Field>

                <Field label="Danh mục công việc">
                    {(f) => (
                        <Select
                            {...f}
                            name="categoryId"
                            value={categoryId}
                            onChange={(event) => setCategoryId(event.target.value)}
                        >
                            <option value="">Không gắn danh mục</option>
                            {jobCategories.map((category) => (
                                <option key={category.categoryId} value={category.categoryId}>
                                    {category.name}
                                </option>
                            ))}
                        </Select>
                    )}
                </Field>
            </form>
        </Dialog>
    );
}
