'use client';

import { useState, useActionState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
// Import thêm action update
import { createDepartmentAction, DepartmentState, updateDepartmentAction } from '@/servers/departments/departments.action';
import { Department } from '@/types/interfaces/departments.interface';
import { IOrganizationOption } from '@ats-platform/types';
import { Button, Dialog, Field, Input, Select, Textarea } from '@/components/ui';
import { cn } from '@/components/ui/cn';

/** Stored on the department as data and shown as its marker, so these stay literal colours, not tokens. */
const COLOR_OPTIONS = [
    { value: '#0071E3', label: 'Xanh dương' },
    { value: '#34C759', label: 'Xanh lá' },
    { value: '#FF9500', label: 'Cam' },
    { value: '#6366F1', label: 'Chàm' },
    { value: '#AF52DE', label: 'Tím' },
    { value: '#FF3B30', label: 'Đỏ' },
];

interface AddDepartmentModalProps {
    onClose: () => void;
    isEdited: boolean;
    editingDept: Department | null;
    onResult: (result: DepartmentState) => void;
    /** Offered only to a platform admin, and only when creating. */
    organizations?: IOrganizationOption[];
}

const initialState = { success: false, message: '' };

const FORM_ID = 'mutate-department-form';

export function MutateDepartmentModal({ onClose, isEdited, editingDept, onResult, organizations = [] }: AddDepartmentModalProps) {
    // A department never changes organization, so the picker exists on create only.
    const showOrganizationPicker = !isEdited && organizations.length > 0;
    const [color, setColor] = useState(isEdited && editingDept?.color ? editingDept.color : COLOR_OPTIONS[0].value);

    // 1. Tự động chọn Action dựa trên trạng thái isEdited
    const actionToRun = isEdited ? updateDepartmentAction : createDepartmentAction;
    const [state, formAction, isPending] = useActionState(actionToRun, initialState);

    const onCloseRef = useRef(onClose);
    const onResultRef = useRef(onResult);
    useEffect(() => {
        onCloseRef.current = onClose;
        onResultRef.current = onResult;
    }, [onClose, onResult]);

    useEffect(() => {
        if (state.success) {
            if (onResultRef.current) {
                onResultRef.current(state);
            }

            const timer = setTimeout(() => {
                onCloseRef.current();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [state]);

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !isPending) onClose();
            }}
            title={isEdited ? 'Cập nhật phòng ban' : 'Thêm phòng ban mới'}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button type="submit" form={FORM_ID} loading={isPending}>
                        {`${isEdited ? 'Cập nhật' : 'Tạo'} phòng ban`}
                    </Button>
                </>
            }
        >
            <form id={FORM_ID} action={formAction} className="space-y-4">
                {/* 2. THÊM HIDDEN INPUT GỬI ID NẾU LÀ CHẾ ĐỘ UPDATE */}
                {isEdited && editingDept?.departmentId && (
                    <input type="hidden" name="departmentId" value={editingDept.departmentId} />
                )}

                {showOrganizationPicker && (
                    <Field
                        label="Tổ chức"
                        required
                        hint="Quản trị viên nền tảng không thuộc tổ chức nào, nên cần chọn tổ chức cho phòng ban mới."
                    >
                        {(f) => (
                            <Select
                                {...f}
                                name="organizationId"
                                defaultValue={organizations.length === 1 ? organizations[0].organizationId : ''}
                            >
                                <option value="" disabled>
                                    Chọn tổ chức sở hữu phòng ban
                                </option>
                                {organizations.map((organization) => (
                                    <option key={organization.organizationId} value={organization.organizationId}>
                                        {organization.name}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>
                )}

                <Field label="Tên phòng ban" required>
                    {(f) => (
                        <Input
                            {...f}
                            type="text"
                            name="name"
                            placeholder="Nhập tên phòng ban"
                            // 3. Đảm bảo fallback về chuỗi rỗng an toàn tuyệt đối
                            defaultValue={isEdited ? (editingDept?.name ?? '') : ''}
                        />
                    )}
                </Field>

                <Field label="Mô tả">
                    {(f) => (
                        <Textarea
                            {...f}
                            name="description"
                            placeholder="Mô tả chức năng và nhiệm vụ"
                            rows={3}
                            // 3. Đảm bảo fallback về chuỗi rỗng an toàn
                            defaultValue={isEdited ? (editingDept?.description ?? '') : ''}
                        />
                    )}
                </Field>

                <fieldset>
                    <legend className="mb-1.5 text-body-sm font-medium text-ink">Màu đại diện</legend>
                    <input type="hidden" name="color" value={color} />
                    <div className="flex flex-wrap gap-2">
                        {COLOR_OPTIONS.map((option) => {
                            const selected = color === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    aria-label={option.label}
                                    aria-pressed={selected}
                                    onClick={() => setColor(option.value)}
                                    className={cn(
                                        'inline-flex size-9 items-center justify-center rounded-ctl text-surface',
                                        'transition duration-press ease-out-expo active:scale-[.97]',
                                        selected && 'ring-2 ring-ink ring-offset-2 ring-offset-surface',
                                    )}
                                    style={{ backgroundColor: option.value }}
                                >
                                    {selected && <Check aria-hidden="true" strokeWidth={1.75} className="size-4" />}
                                </button>
                            );
                        })}
                    </div>
                </fieldset>
            </form>
        </Dialog>
    );
}
