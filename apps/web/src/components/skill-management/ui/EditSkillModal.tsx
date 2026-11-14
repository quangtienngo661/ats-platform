'use client';
import { useLatestCallback } from '@/lib/useLatestCallback';

import { useEffect, useActionState, useState } from 'react';
import { updateSkillAction, SkillActionState } from '@/servers/skills/skills.action';
import { ISkillDto } from '@/types/interfaces/skill.interface';
import { Button, Dialog, Field, Input } from '@/components/ui';
import { toast } from '@/lib/toast';

interface EditSkillModalProps {
    skill: ISkillDto;
    existingCategories: string[];
    onClose: () => void;
}

const initialState: SkillActionState = { success: false, message: '' };

const FORM_ID = 'edit-skill-form';

export function EditSkillModal({ skill, existingCategories, onClose }: EditSkillModalProps) {
    const onCloseLatest = useLatestCallback(onClose);
    const [state, dispatch, isPending] = useActionState(updateSkillAction, initialState);

    // Track inputs to determine isDirty
    const [name, setName] = useState(skill.name);
    const [category, setCategory] = useState(skill.category ?? '');
    const isDirty = name !== skill.name || (category || '') !== (skill.category ?? '');

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
            title="Chỉnh sửa kỹ năng"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button type="submit" form={FORM_ID} loading={isPending} disabled={!isDirty}>
                        {isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
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

                {/* Hidden field to pass skillId */}
                <input type="hidden" name="skillId" value={skill.skillId} />

                <Field label="Tên kỹ năng" required>
                    {(f) => <Input {...f} type="text" name="name" value={name} onChange={(e) => setName(e.target.value)} />}
                </Field>

                <Field label="Danh mục (tùy chọn)">
                    {(f) => (
                        <>
                            <Input
                                {...f}
                                type="text"
                                name="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                list="edit-category-suggestions"
                            />
                            <datalist id="edit-category-suggestions">
                                {existingCategories.map((cat) => <option key={cat} value={cat} />)}
                            </datalist>
                        </>
                    )}
                </Field>
            </form>
        </Dialog>
    );
}
