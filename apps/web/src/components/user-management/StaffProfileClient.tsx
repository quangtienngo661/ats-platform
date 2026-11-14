'use client';

import { useActionState } from 'react';
import { Avatar, Button, Field, Input, PageToolbar, Surface } from '@/components/ui';
import { updateMeAction, type UserActionState } from '@/servers/users/users.action';
import { IUserResponseDto } from '@/types/interfaces/user.interface';

export default function StaffProfileClient({ user, organizationName }: {
  user: IUserResponseDto; organizationName?: string;
}) {
  const [state, action, pending] = useActionState(updateMeAction, { success: false, message: '' } as UserActionState);
  return (
    <div className="mx-auto w-full max-w-3xl p-4 lg:p-8">
      <PageToolbar title="Hồ sơ cá nhân" />
      <p className="mt-2 break-words text-body-sm text-ink-3">
        {user.role === 'org_admin' ? 'Quản trị tổ chức' : 'Quản trị hệ thống'} · {organizationName ?? 'Toàn hệ thống'}
      </p>
      <form action={action} className="mt-6">
      <Surface variant="raised" className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <Avatar name={user.fullName} size={40} />
          <p className="min-w-0 break-all text-body-sm text-ink">Email: {user.email}</p>
        </div>
        <Field label="Họ và tên" required>
          {(f) => <Input {...f} name="fullName" defaultValue={user.fullName} />}
        </Field>
        <Field label="Số điện thoại">
          {(f) => <Input {...f} name="phone" type="tel" defaultValue={user.phoneNumber ?? ''} />}
        </Field>
        {state.message && (
          <p role="status" className={state.success ? 'text-body-sm text-success' : 'text-body-sm text-danger'}>
            {state.message}
          </p>
        )}
        <Button type="submit" loading={pending}>{pending ? 'Đang lưu…' : 'Lưu thay đổi'}</Button>
      </Surface>
      </form>
    </div>
  );
}
