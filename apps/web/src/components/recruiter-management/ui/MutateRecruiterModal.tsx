'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createRecruiterAction, updateRecruiterAction, RecruiterActionState } from '@/servers/recruiters/recruiters.action';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';
import { IUserDto } from '@ats-platform/types';

interface Props {
  onClose: () => void;
  isEdited: boolean;
  editingRecruiter: IRecruiterDto | null;
  departments: { departmentId: string; name: string; color: string }[];
  users: IUserDto[];
  canAssignExisting?: boolean;
  onResult: (result: RecruiterActionState) => void;
}

export function MutateRecruiterModal({ onClose, isEdited, editingRecruiter, departments, users, canAssignExisting = false, onResult }: Props) {
  const [mode, setMode] = useState('new');
  const [state, action, pending] = useActionState(isEdited ? updateRecruiterAction : createRecruiterAction, { success: false, message: '' } as RecruiterActionState);
  const callbacks = useRef({ onClose, onResult });
  useEffect(() => { callbacks.current = { onClose, onResult }; }, [onClose, onResult]);
  useEffect(() => {
    if (state.success) { callbacks.current.onResult(state); callbacks.current.onClose(); }
  }, [state]);
  const input = 'border rounded-xl p-3 w-full text-sm';
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="recruiter-dialog-title" className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={event => event.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 id="recruiter-dialog-title" className="text-xl font-semibold">{isEdited ? 'Cập nhật nhà tuyển dụng' : 'Thêm nhà tuyển dụng mới'}</h2>
          <button type="button" aria-label="Đóng" onClick={onClose}>×</button>
        </div>
        <form action={action} className="space-y-4">
          {isEdited && <input type="hidden" name="recruiterId" value={editingRecruiter?.recruiterId ?? ''} />}
          <input type="hidden" name="accountMode" value={mode} />
          {!isEdited && canAssignExisting && (
            <div><label htmlFor="recruiter-mode">Cách thêm recruiter</label>
              <select id="recruiter-mode" value={mode} onChange={e => setMode(e.target.value)} className={input}>
                <option value="new">Tạo tài khoản mới</option><option value="existing">Gán tài khoản recruiter có sẵn</option>
              </select></div>
          )}
          {isEdited ? <p>Tài khoản: {editingRecruiter?.user?.fullName} · {editingRecruiter?.user?.email}</p> : mode === 'existing' ? (
            <div><label htmlFor="recruiter-user">Tài khoản recruiter</label><select id="recruiter-user" name="userId" required className={input}>
              <option value="">Chọn tài khoản chưa có hồ sơ</option>
              {users.filter(user => user.role === 'recruiter' && user.status === 'active').map(user => <option key={user.userId} value={user.userId}>{user.fullName} · {user.email}</option>)}
            </select></div>
          ) : <>
            <div><label htmlFor="recruiter-name">Họ và tên</label><input id="recruiter-name" name="fullName" required className={input} /></div>
            <div><label htmlFor="recruiter-email">Email</label><input id="recruiter-email" name="email" type="email" required className={input} /></div>
            <div><label htmlFor="recruiter-password">Mật khẩu</label><input id="recruiter-password" name="password" type="password" autoComplete="new-password" required minLength={8} className={input} />
              <p className="text-xs text-gray-500 mt-1">Tối thiểu 8 ký tự, có chữ thường, chữ hoa, số và ký tự đặc biệt.</p></div>
          </>}
          <div><label htmlFor="recruiter-department">Phòng ban</label>
            <select id="recruiter-department" name="departmentId" required defaultValue={editingRecruiter?.department?.departmentId ?? ''} className={input}>
              <option value="">Chọn phòng ban</option>
              {departments.map(dept => <option key={dept.departmentId} value={dept.departmentId}>{dept.name}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">Tài khoản thuộc tổ chức của phòng ban đã chọn.</p>
          </div>
          <div><label htmlFor="recruiter-position">Chức vụ</label><input id="recruiter-position" name="position" required defaultValue={editingRecruiter?.position ?? ''} className={input} /></div>
          {state.message && <p role="status" className="text-red-700">{state.message}</p>}
          {departments.length === 0 && <p role="status">Cần tạo phòng ban trước khi thêm recruiter.</p>}
          <div className="flex gap-3 pt-3"><button type="button" onClick={onClose} className={input}>Hủy</button>
            <button type="submit" disabled={pending || departments.length === 0} className="bg-blue-600 disabled:bg-gray-300 text-white rounded-xl p-3 w-full">{pending ? 'Đang lưu...' : isEdited ? 'Cập nhật' : 'Tạo'}</button></div>
        </form>
      </section>
    </div>
  );
}
