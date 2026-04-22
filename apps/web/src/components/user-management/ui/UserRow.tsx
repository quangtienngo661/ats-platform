'use client';

import { Pencil, Trash2, AlertTriangle, Phone, Mail } from 'lucide-react';
import { useState } from 'react';
import { SF, SFT } from '@/types/fonts/fonts';
import { UserRole, UserStatus } from '@ats-platform/types';
import { IUserResponseDto } from '@/types/interfaces/user.interface';

// Role display config
const ROLE_CONFIG: Record<UserRole, { label: string; cls: string }> = {
  [UserRole.admin]: { label: 'Quản trị viên', cls: 'bg-[#FFE5E5] text-[#FF3B30]' },
  [UserRole.recruiter]: { label: 'Tuyển dụng', cls: 'bg-[#E3F2FF] text-[#0071E3]' },
  [UserRole.candidate]: { label: 'Ứng viên', cls: 'bg-[#FFF4E5] text-[#FF9500]' },
};

// Deterministic avatar color from userId
const COLORS = ['#0071E3', '#34C759', '#FF9500', '#6366F1', '#AF52DE', '#FF3B30', '#00BCD4'];
function avatarColor(userId: string) {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) & 0xffffffff;
  return COLORS[Math.abs(h) % COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

interface UserRowProps {
  user: IUserResponseDto;
  onEdit: (user: IUserResponseDto) => void;
  onDelete: (userId: string) => void;
}

export function UserRow({ user, onEdit, onDelete }: UserRowProps) {
  const [confirming, setConfirming] = useState(false);
  const role = ROLE_CONFIG[user.role] ?? { label: user.role, cls: 'bg-[#F5F5F7] text-[#6E6E73]' };
  const color = avatarColor(user.userId);

  return (
    <tr className="group border-b border-[#F2F2F7] hover:bg-[#FAFAFA] transition-colors">
      {/* Người dùng */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] flex-shrink-0"
            style={{ background: color, fontFamily: SF, fontWeight: 700 }}
          >
            {getInitials(user.fullName)}
          </div>
          <div className="min-w-0">
            <p
              className="text-[14px] text-[#1D1D1F] truncate"
              style={{ fontFamily: SF, fontWeight: 600 }}
            >
              {user.fullName}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              <span
                className="text-[11px] text-[#6E6E73] flex items-center gap-1"
                style={{ fontFamily: SFT }}
              >
                <Mail className="w-3 h-3 text-[#AEAEB2]" /> {user.email}
              </span>
              {user.phone && (
                <span
                  className="text-[11px] text-[#6E6E73] flex items-center gap-1"
                  style={{ fontFamily: SFT }}
                >
                  <Phone className="w-3 h-3 text-[#AEAEB2]" /> {user.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Vai trò */}
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] ${role.cls}`}
          style={{ fontFamily: SF, fontWeight: 600 }}
        >
          {role.label}
        </span>
      </td>

      {/* Trạng thái */}
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] ${user.status === UserStatus.active ? 'bg-[#E8F5E9] text-[#34C759]' : 'bg-[#F2F2F7] text-[#AEAEB2]'
            }`}
          style={{ fontFamily: SF, fontWeight: 600 }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${user.status === UserStatus.active ? 'bg-[#34C759]' : 'bg-[#AEAEB2]'
              }`}
          />
          {user.status === UserStatus.active ? 'Hoạt động' : 'Ngưng'}
        </span>
      </td>

      {/* Ngày tạo */}
      <td className="px-6 py-4">
        <span className="text-[13px] text-[#6E6E73]" style={{ fontFamily: SFT }}>
          {formatDate(user.createdAt)}
        </span>
      </td>

      {/* Thao tác */}
      <td className="px-6 py-4 text-right w-[180px]">
        {confirming ? (
          <div className="flex items-center justify-end gap-2">
            <span
              className="text-[11px] text-[#FF3B30] flex items-center gap-1"
              style={{ fontFamily: SFT }}
            >
              <AlertTriangle className="w-3 h-3" /> Xác nhận xóa?
            </span>
            <button
              onClick={() => {
                onDelete(user.userId);
                setConfirming(false);
              }}
              className="text-[11px] text-white bg-[#FF3B30] hover:bg-[#E0352B] px-2.5 py-1 rounded-lg transition-colors"
              style={{ fontFamily: SF, fontWeight: 600 }}
            >
              Xóa
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-[11px] text-[#6E6E73] hover:bg-[#F5F5F7] px-2.5 py-1 rounded-lg transition-colors"
            >
              Hủy
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(user)}
              className="p-1.5 rounded-lg text-[#0071E3] hover:bg-[#EBF3FD] transition-colors"
              title="Chỉnh sửa"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="p-1.5 rounded-lg text-[#FF3B30] hover:bg-[#FFE5E5] transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
