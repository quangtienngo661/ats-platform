'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createRecruiterAction, updateRecruiterAction, RecruiterActionState } from '@/servers/recruiters/recruiters.action';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';
import { IUserDto } from '@ats-platform/types';
import { Button, Dialog, Field, Input, Select } from '@/components/ui';

interface Props {
  onClose: () => void;
  isEdited: boolean;
  editingRecruiter: IRecruiterDto | null;
  departments: { departmentId: string; name: string; color: string }[];
  users: IUserDto[];
  canAssignExisting?: boolean;
  onResult: (result: RecruiterActionState) => void;
}

const FORM_ID = 'mutate-recruiter-form';

export function MutateRecruiterModal({ onClose, isEdited, editingRecruiter, departments, users, canAssignExisting = false, onResult }: Props) {
  const [mode, setMode] = useState('new');
  const [state, action, pending] = useActionState(isEdited ? updateRecruiterAction : createRecruiterAction, { success: false, message: '' } as RecruiterActionState);
  const callbacks = useRef({ onClose, onResult });
  useEffect(() => { callbacks.current = { onClose, onResult }; }, [onClose, onResult]);
  useEffect(() => {
    if (state.success) { callbacks.current.onResult(state); callbacks.current.onClose(); }
  }, [state]);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
      title={isEdited ? 'Cập nhật nhà tuyển dụng' : 'Thêm nhà tuyển dụng mới'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form={FORM_ID} loading={pending} disabled={departments.length === 0}>
            {pending ? 'Đang lưu…' : isEdited ? 'Cập nhật' : 'Tạo'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} action={action} className="space-y-4">
        {isEdited && <input type="hidden" name="recruiterId" value={editingRecruiter?.recruiterId ?? ''} />}
        <input type="hidden" name="accountMode" value={mode} />

        {!isEdited && canAssignExisting && (
          <Field label="Cách thêm recruiter">
            {(f) => (
              <Select {...f} value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="new">Tạo tài khoản mới</option>
                <option value="existing">Gán tài khoản recruiter có sẵn</option>
              </Select>
            )}
          </Field>
        )}

        {isEdited ? (
          <p className="break-words rounded-ctl bg-surface-2 px-3 py-2 text-body-sm text-ink">
            Tài khoản: {editingRecruiter?.user?.fullName} · {editingRecruiter?.user?.email}
          </p>
        ) : mode === 'existing' ? (
          <Field label="Tài khoản recruiter" required>
            {(f) => (
              <Select {...f} name="userId" defaultValue="">
                <option value="">Chọn tài khoản chưa có hồ sơ</option>
                {users
                  .filter((user) => user.role === 'recruiter' && user.status === 'active')
                  .map((user) => (
                    <option key={user.userId} value={user.userId}>
                      {user.fullName} · {user.email}
                    </option>
                  ))}
              </Select>
            )}
          </Field>
        ) : (
          <>
            <Field label="Họ và tên" required>
              {(f) => <Input {...f} name="fullName" />}
            </Field>
            <Field label="Email" required>
              {(f) => <Input {...f} name="email" type="email" autoComplete="off" spellCheck={false} />}
            </Field>
            <Field label="Mật khẩu" required hint="Tối thiểu 8 ký tự, có chữ thường, chữ hoa, số và ký tự đặc biệt.">
              {(f) => <Input {...f} name="password" type="password" autoComplete="new-password" minLength={8} />}
            </Field>
          </>
        )}

        <Field label="Phòng ban" required hint="Tài khoản thuộc tổ chức của phòng ban đã chọn.">
          {(f) => (
            <Select {...f} name="departmentId" defaultValue={editingRecruiter?.department?.departmentId ?? ''}>
              <option value="">Chọn phòng ban</option>
              {departments.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Chức vụ" required>
          {(f) => <Input {...f} name="position" defaultValue={editingRecruiter?.position ?? ''} />}
        </Field>

        {!state.success && state.message && (
          <p role="status" className="rounded-ctl bg-danger-soft px-3 py-2 text-body-sm text-danger">
            {state.message}
          </p>
        )}
        {departments.length === 0 && (
          <p role="status" className="text-body-sm text-ink-3">
            Cần tạo phòng ban trước khi thêm recruiter.
          </p>
        )}
      </form>
    </Dialog>
  );
}
