'use client';

import { useActionState, useEffect } from 'react';
import { useLatestCallback } from '@/lib/useLatestCallback';
import { updateUserAction, type UserActionState } from '@/servers/users/users.action';
import { toast } from '@/lib/toast';
import { IOrganizationOption, UserRole, UserStatus } from '@ats-platform/types';
import { IUserResponseDto } from '@/types/interfaces/user.interface';
import { Button, Dialog, Field, Input, Select } from '@/components/ui';

interface EditUserModalProps {
  organizations?: IOrganizationOption[];
  user: IUserResponseDto;
  onClose: () => void;
  onUpdated: (user: IUserResponseDto) => void;
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

const FORM_ID = 'edit-user-form';

export function EditUserModal({ user, onClose, onUpdated, organizations = [] }: EditUserModalProps) {
  const onCloseLatest = useLatestCallback(onClose);
  const onUpdatedLatest = useLatestCallback(onUpdated);
  const [state, formAction, isPending] = useActionState(updateUserAction, INITIAL_STATE);

  useEffect(() => {
    if (!state.message) return;
    if (state.success && state.data) {
      toast.success('Cập nhật thành công', `"${state.data.fullName}" đã được lưu`);
      onUpdatedLatest(state.data);
      onCloseLatest();
    } else if (!state.success && state.message) {
      toast.error('Cập nhật thất bại', state.message);
    }
  }, [state, onCloseLatest, onUpdatedLatest]);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
      }}
      title="Chỉnh sửa người dùng"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form={FORM_ID} loading={isPending}>
            {isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
          </Button>
        </>
      }
    >
      {/* Radix puts focus on the first field ("Họ và tên") as the dialog opens. */}
      <form id={FORM_ID} action={formAction} className="space-y-4">
        {/* In the body rather than the dialog description, so a long address can wrap. */}
        <p className="break-all text-body-sm text-ink-3">{user.email}</p>
        <input type="hidden" name="userId" value={user.userId} />

        {!state.success && state.message && (
          <div className="rounded-ctl bg-danger-soft px-3 py-2 text-body-sm text-danger">{state.message}</div>
        )}

        <Field label="Họ và tên" required>
          {(f) => <Input {...f} name="fullName" type="text" defaultValue={user.fullName} />}
        </Field>

        <Field label="Email" required>
          {(f) => (
            <Input
              {...f}
              name="email"
              type="email"
              autoComplete="off"
              spellCheck={false}
              defaultValue={user.email}
            />
          )}
        </Field>

        <Field label={<>Mật khẩu mới <span className="font-normal text-ink-3">(bỏ trống để giữ nguyên)</span></>}>
          {(f) => (
            <Input
              {...f}
              aria-label="Mật khẩu mới"
              name="password"
              type="password"
              placeholder="Nhập để thay đổi mật khẩu…"
            />
          )}
        </Field>

        <Field label={<>Số điện thoại <span className="font-normal text-ink-3">(tùy chọn)</span></>}>
          {(f) => (
            <Input
              {...f}
              aria-label="Số điện thoại"
              name="phone"
              type="tel"
              defaultValue={user.phoneNumber ?? ''}
              placeholder="+84901234567"
            />
          )}
        </Field>

        {user.role === UserRole.org_admin && (
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
              <Select {...f} name="organizationId" defaultValue={user.organizationId ?? ''}>
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
          <Field label="Vai trò">
            {(f) => (
              <>
                <Select {...f} disabled defaultValue={user.role}>
                  <option value={user.role}>{ROLES.find((r) => r.value === user.role)?.label}</option>
                </Select>
                {/* A disabled select is not submitted; the role cannot change, so send it as is. */}
                <input type="hidden" name="role" value={user.role} />
              </>
            )}
          </Field>
          <Field label="Trạng thái">
            {(f) => (
              <Select {...f} name="status" defaultValue={user.status}>
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
