'use client';

import { useActionState, useEffect, useState } from 'react';
import { useLatestCallback } from '@/lib/useLatestCallback';
import { createUserAction, type UserActionState } from '@/servers/users/users.action';
import { toast } from '@/lib/toast';
import { IOrganizationOption, UserRole, UserStatus } from '@ats-platform/types';
import { IUserResponseDto } from '@/types/interfaces/user.interface';
import { Button, Dialog, Field, Input, Select } from '@/components/ui';

interface AddUserModalProps {
  organizations?: IOrganizationOption[];
  onClose: () => void;
  onCreated: (user: IUserResponseDto) => void;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: UserRole.recruiter, label: 'Tuyển dụng' },
  { value: UserRole.admin, label: 'Quản trị viên' },
  { value: UserRole.org_admin, label: 'Quản trị tổ chức' },
  { value: UserRole.candidate, label: 'Ứng viên' },
];

const STATUSES: { value: UserStatus; label: string }[] = [
  { value: UserStatus.active, label: 'Hoạt động' },
  { value: UserStatus.inactive, label: 'Ngưng' },
];

const INITIAL_STATE: UserActionState = { success: false, message: '' };

const FORM_ID = 'add-user-form';

export function AddUserModal({ onClose, onCreated, organizations = [] }: AddUserModalProps) {
  const onCloseLatest = useLatestCallback(onClose);
  const onCreatedLatest = useLatestCallback(onCreated);
  const [state, formAction, isPending] = useActionState(createUserAction, INITIAL_STATE);
  const [role, setRole] = useState<UserRole>(UserRole.recruiter);

  useEffect(() => {
    if (!state.message) return;
    if (state.success && state.data) {
      toast.success('Tạo người dùng thành công', `"${state.data.fullName}" đã được thêm`);
      onCreatedLatest(state.data);
      onCloseLatest();
    } else if (!state.success && state.message) {
      toast.error('Tạo người dùng thất bại', state.message);
    }
  }, [state, onCloseLatest, onCreatedLatest]);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
      }}
      title="Thêm người dùng"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form={FORM_ID} loading={isPending}>
            {isPending ? 'Đang tạo…' : 'Tạo tài khoản'}
          </Button>
        </>
      }
    >
      {/* Radix puts focus on the first field ("Họ và tên") as the dialog opens. */}
      <form id={FORM_ID} action={formAction} className="space-y-4">
        {!state.success && state.message && (
          <div className="rounded-ctl bg-danger-soft px-3 py-2 text-body-sm text-danger">{state.message}</div>
        )}

        <Field label="Họ và tên" required>
          {(f) => <Input {...f} name="fullName" type="text" placeholder="Nguyễn Văn A" />}
        </Field>

        <Field label="Email" required>
          {(f) => (
            <Input
              {...f}
              name="email"
              type="email"
              autoComplete="off"
              spellCheck={false}
              placeholder="email@company.com"
            />
          )}
        </Field>

        <Field
          label="Mật khẩu"
          required
          hint="Tối thiểu 8 ký tự, có chữ hoa, số, ký tự đặc biệt. Ví dụ: StrongP@ss1"
        >
          {(f) => <Input {...f} name="password" type="password" />}
        </Field>

        <Field label={<>Số điện thoại <span className="font-normal text-ink-3">(tùy chọn)</span></>}>
          {(f) => <Input {...f} aria-label="Số điện thoại" name="phone" type="tel" placeholder="+84901234567" />}
        </Field>

        {role === UserRole.org_admin && (
          <Field
            label="Tổ chức"
            required
            hint={
              organizations.length === 0 ? (
                <span role="status">Chưa có tổ chức để chọn. Vui lòng kiểm tra danh sách tổ chức.</span>
              ) : undefined
            }
          >
            {(f) => (
              <Select {...f} name="organizationId" defaultValue="">
                <option value="">Chọn tổ chức</option>
                {organizations.map((org) => (
                  <option key={org.organizationId} value={org.organizationId}>
                    {org.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Vai trò" required>
            {(f) => (
              <Select {...f} name="role" value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Trạng thái">
            {(f) => (
              <Select {...f} name="status" defaultValue={UserStatus.active}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </form>
    </Dialog>
  );
}
