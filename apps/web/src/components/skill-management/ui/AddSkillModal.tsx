'use client';
import { useLatestCallback } from '@/lib/useLatestCallback';

import { useEffect, useActionState } from 'react';
import { createSkillAction, SkillActionState } from '@/servers/skills/skills.action';
import { Button, Dialog, Field, Input } from '@/components/ui';
import { toast } from '@/lib/toast';

interface AddSkillModalProps {
    existingCategories: string[];
    onClose: () => void;
}

const initialState: SkillActionState = { success: false, message: '' };

const FORM_ID = 'add-skill-form';

export function AddSkillModal({ existingCategories, onClose }: AddSkillModalProps) {
    const onCloseLatest = useLatestCallback(onClose);
    const [state, dispatch, isPending] = useActionState(createSkillAction, initialState);

    // Watch state to handle success/error
    useEffect(() => {
        if (state.success && state.data) {
            toast.success('Thành công', state.message);
            onCloseLatest();
        } else if (state.message) {
            toast.error('Lỗi', state.message);
        }
    }, [state, onCloseLatest]);

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !isPending) onClose();
            }}
            title="Thêm kỹ năng mới"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button type="submit" form={FORM_ID} loading={isPending}>
                        {isPending ? 'Đang tạo…' : 'Tạo kỹ năng'}
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

                <Field label="Tên kỹ năng" required>
                    {(f) => <Input {...f} type="text" name="name" placeholder="Ví dụ: TypeScript, React, Docker…" />}
                </Field>

                <Field label="Danh mục (tùy chọn)" hint="Nhập hoặc chọn từ danh mục có sẵn">
                    {(f) => (
                        <>
                            <Input
                                {...f}
                                type="text"
                                name="category"
                                placeholder="Ví dụ: Programming Language, Framework…"
                                list="category-suggestions"
                            />
                            <datalist id="category-suggestions">
                                {existingCategories.map((cat) => <option key={cat} value={cat} />)}
                            </datalist>
                        </>
                    )}
                </Field>
            </form>
        </Dialog>
    );
}
