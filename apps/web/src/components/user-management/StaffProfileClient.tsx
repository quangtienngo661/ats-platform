'use client';

import { useActionState } from 'react';
import { updateMeAction, type UserActionState } from '@/servers/users/users.action';
import { IUserResponseDto } from '@/types/interfaces/user.interface';

export default function StaffProfileClient({ user, organizationName }: {
  user: IUserResponseDto; organizationName?: string;
}) {
  const [state, action, pending] = useActionState(updateMeAction, { success: false, message: '' } as UserActionState);
  return (
    <main className="p-6 lg:p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-2">Hồ sơ cá nhân</h1>
      <p className="mb-6 text-gray-600">{user.role === 'org_admin' ? 'Quản trị tổ chức' : 'Quản trị hệ thống'} · {organizationName ?? 'Toàn hệ thống'}</p>
      <form action={action} className="bg-white rounded-2xl p-6 space-y-4">
        <p>Email: {user.email}</p>
        <div><label htmlFor="staff-fullName" className="block mb-2">Họ và tên</label>
          <input id="staff-fullName" name="fullName" required defaultValue={user.fullName} className="border rounded-xl p-3 w-full" /></div>
        <div><label htmlFor="staff-phone" className="block mb-2">Số điện thoại</label>
          <input id="staff-phone" name="phone" type="tel" defaultValue={user.phoneNumber ?? ''} className="border rounded-xl p-3 w-full" /></div>
        {state.message && <p role="status" className={state.success ? 'text-green-700' : 'text-red-700'}>{state.message}</p>}
        <button type="submit" disabled={pending} className="bg-blue-600 text-white px-4 py-3 rounded-xl">{pending ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
      </form>
    </main>
  );
}
