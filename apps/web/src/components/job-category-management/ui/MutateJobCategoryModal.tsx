'use client';

import { useState, useActionState, useEffect, useRef } from 'react';
import { Button, Dialog, Field, Input, Select } from '@/components/ui';
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

const FORM_ID = 'mutate-job-category-form';

export function MutateJobCategoryModal({ onClose, editingCategory, parentCategories }: MutateJobCategoryModalProps) {
    const isEditing = !!(editingCategory?.categoryId);
    const isAddingChild = !isEditing && !!editingCategory?.parentCategoryId;

    const [parentId, setParentId] = useState<string>(
        editingCategory?.parentCategoryId || ''
    );

    const performAction = isEditing ? updateJobCategoryAction : createJobCategoryAction;

    const [state, formAction, isPending] = useActionState(performAction, initialState);

    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (state.success) {
            const timer = setTimeout(() => onCloseRef.current(), 300);
            toast.success(state.message)
            return () => clearTimeout(timer);
        }
    }, [state.success, state.message]);

    // Determine modal title
    let title = 'Thêm danh mục mới';
    if (isEditing) title = 'Cập nhật danh mục';
    else if (isAddingChild) {
        const parent = parentCategories.find((c) => c.categoryId === editingCategory?.parentCategoryId);
        title = `Thêm danh mục con — ${parent?.name || ''}`;
    }

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !isPending) onClose();
            }}
            title={title}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button type="submit" form={FORM_ID} loading={isPending}>
                        {isEditing ? 'Cập nhật' : 'Tạo danh mục'}
                    </Button>
                </>
            }
        >
            <form id={FORM_ID} action={formAction} className="space-y-4">
                {isEditing && editingCategory?.categoryId && (
                    <input type="hidden" name="categoryId" value={editingCategory.categoryId} />
                )}
                <input type="hidden" name="parentCategoryId" value={parentId} />

                <Field label="Tên danh mục" required>
                    {(f) => (
                        <Input
                            {...f}
                            type="text"
                            name="name"
                            placeholder="Ví dụ: Công nghệ thông tin"
                            defaultValue={isEditing ? (editingCategory?.name ?? '') : ''}
                        />
                    )}
                </Field>

                {!isAddingChild && (
                    <Field label="Danh mục cha" hint="Để trống nếu đây là danh mục cấp cao nhất">
                        {(f) => (
                            <Select {...f} value={parentId} onChange={(e) => setParentId(e.target.value)}>
                                <option value="">— Không (danh mục gốc) —</option>
                                {parentCategories
                                    .filter((cat) => !cat.parentCategoryId)
                                    .map((cat) => (
                                        <option
                                            key={cat.categoryId}
                                            value={cat.categoryId}
                                            disabled={isEditing && cat.categoryId === editingCategory?.categoryId}
                                        >
                                            {cat.name}
                                        </option>
                                    ))}
                            </Select>
                        )}
                    </Field>
                )}

                {state.message && !state.success && (
                    <p role="alert" className="rounded-ctl bg-danger-soft px-3 py-2 text-body-sm text-danger">
                        {state.message}
                    </p>
                )}
            </form>
        </Dialog>
    );
}
