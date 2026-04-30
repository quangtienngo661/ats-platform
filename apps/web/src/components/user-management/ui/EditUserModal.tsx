'use client';

import { useActionState, useEffect, useRef } from 'react';
import { X, Pencil } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';
import { motion, AnimatePresence } from 'motion/react';
import { updateUserAction, type UserActionState } from '@/servers/users/users.action';
import { toast } from '@/lib/toast';
import { UserRole, UserStatus } from '@ats-platform/types';
import { IUserResponseDto } from '@/types/interfaces/user.interface';

interface EditUserModalProps {
  user: IUserResponseDto;
  onClose: () => void;
  onUpdated: (user: IUserResponseDto) => void;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: UserRole.recruiter, label: 'Tuyển dụng' },
  { value: UserRole.admin, label: 'Quản trị viên' },
  { value: UserRole.candidate, label: 'Ứng viên' },
];

const STATUSES: { value: UserStatus; label: string }[] = [
  { value: UserStatus.active, label: 'Hoạt động' },
  { value: UserStatus.inactive, label: 'Ngưng' },
];

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]';
const selectCls = `${inputCls} cursor-pointer appearance-none`;

const INITIAL_STATE: UserActionState = { success: false, message: '' };

export function EditUserModal({ user, onClose, onUpdated }: EditUserModalProps) {
  const [state, formAction, isPending] = useActionState(updateUserAction, INITIAL_STATE);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!state.message) return;
    if (state.success && state.data) {
      toast.success('Cập nhật thành công', `"${state.data.fullName}" đã được lưu`);
      onUpdated(state.data);
      onClose();
    } else if (!state.success && state.message) {
      toast.error('Cập nhật thất bại', state.message);
    }
  }, [state]);

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#F2F2F7] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EBF3FD] flex items-center justify-center">
                <Pencil className="w-4 h-4 text-[#0071E3]" />
              </div>
              <div>
                <h2
                  className="text-[18px] text-[#1D1D1F] tracking-[-0.01em]"
                  style={{ fontFamily: SF, fontWeight: 600 }}
                >
                  Chỉnh sửa người dùng
                </h2>
                <p className="text-[12px] text-[#6E6E73]">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#AEAEB2] hover:bg-[#F5F5F7] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <form action={formAction} className="flex flex-col flex-1 overflow-hidden">
            {/* Hidden field: userId */}
            <input type="hidden" name="userId" value={user.userId} />

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {!state.success && state.message && (
                <div
                  className="px-4 py-3 rounded-xl bg-[#FFE5E5] text-[#FF3B30] text-[13px]"
                  style={{ fontFamily: SF }}
                >
                  {state.message}
                </div>
              )}

              <div>
                <label
                  className="block text-[13px] text-[#1D1D1F] mb-2"
                  style={{ fontWeight: 500 }}
                >
                  Họ và tên <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  ref={nameRef}
                  name="fullName"
                  type="text"
                  required
                  defaultValue={user.fullName}
                  className={inputCls}
                  style={{ fontFamily: SF }}
                />
              </div>

              <div>
                <label
                  className="block text-[13px] text-[#1D1D1F] mb-2"
                  style={{ fontWeight: 500 }}
                >
                  Email <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={user.email}
                  className={inputCls}
                  style={{ fontFamily: SF }}
                />
              </div>

              <div>
                <label
                  className="block text-[13px] text-[#1D1D1F] mb-2"
                  style={{ fontWeight: 500 }}
                >
                  Mật khẩu mới{' '}
                  <span className="text-[#AEAEB2] font-normal">(bỏ trống để giữ nguyên)</span>
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="Nhập để thay đổi mật khẩu..."
                  className={inputCls}
                  style={{ fontFamily: SF }}
                />
              </div>

              <div>
                <label
                  className="block text-[13px] text-[#1D1D1F] mb-2"
                  style={{ fontWeight: 500 }}
                >
                  Số điện thoại{' '}
                  <span className="text-[#AEAEB2] font-normal">(tùy chọn)</span>
                </label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={user.phoneNumber ?? ''}
                  placeholder="+84901234567"
                  className={inputCls}
                  style={{ fontFamily: SF }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-[13px] text-[#1D1D1F] mb-2"
                    style={{ fontWeight: 500 }}
                  >
                    Vai trò
                  </label>
                  <select
                    disabled={true}
                    defaultValue={user.role}
                    className={selectCls}
                    style={{ fontFamily: SF }}
                  >
                    <option value={user.role}>
                      {ROLES.find((r) => r.value === user.role)?.label}
                    </option>
                  </select>
                  <input type="hidden" name="role" value={user.role} />
                </div>
                <div>
                  <label
                    className="block text-[13px] text-[#1D1D1F] mb-2"
                    style={{ fontWeight: 500 }}
                  >
                    Trạng thái
                  </label>
                  <select
                    name="status"
                    defaultValue={user.status}
                    className={selectCls}
                    style={{ fontFamily: SF }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#F2F2F7] flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[14px]"
                style={{ fontWeight: 500 }}
              >
                Hủy
              </button>
              <motion.button
                type="submit"
                disabled={isPending}
                whileTap={{ scale: 0.97 }}
                className="flex-1 px-4 py-3 bg-[#0071E3] hover:bg-[#0077ED] disabled:bg-[#E5E5EA] disabled:text-[#AEAEB2] text-white rounded-xl transition-all shadow-sm text-[14px]"
                style={{ fontWeight: 600 }}
              >
                {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
