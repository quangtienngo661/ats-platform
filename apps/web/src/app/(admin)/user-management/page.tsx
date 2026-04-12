'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Plus, Edit2, Trash2, Users, UserCircle, Shield } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';

const users = [
  { id: 1, name: 'Alex Johnson', email: 'alex.johnson@acme.com', role: 'HR Manager', department: 'Nhân sự', status: 'active', avatar: 'AJ', color: '#0071E3' },
  { id: 2, name: 'Sarah Chen', email: 'sarah.chen@acme.com', role: 'Recruiter', department: 'Nhân sự', status: 'active', avatar: 'SC', color: '#34C759' },
  { id: 3, name: 'Michael Brown', email: 'michael.brown@acme.com', role: 'Admin', department: 'IT', status: 'active', avatar: 'MB', color: '#FF9500' },
  { id: 4, name: 'Emily Davis', email: 'emily.davis@acme.com', role: 'Recruiter', department: 'Nhân sự', status: 'active', avatar: 'ED', color: '#6366F1' },
  { id: 5, name: 'David Wilson', email: 'david.wilson@acme.com', role: 'HR Manager', department: 'Nhân sự', status: 'inactive', avatar: 'DW', color: '#AEAEB2' },
];

const roleColors: Record<string, string> = {
  Admin: 'bg-[#FFE5E5] text-[#FF3B30]',
  'HR Manager': 'bg-[#E3F2FF] text-[#0071E3]',
  Recruiter: 'bg-[#E8F5E9] text-[#34C759]',
};

export default function UserListPage() {
  const [searchFocus, setSearchFocus] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="p-6 lg:p-8" style={{ fontFamily: SFT }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#0071E3] flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[24px] text-[#1D1D1F] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>
              Quản lý người dùng
            </h1>
            <p className="text-[13px] text-[#6E6E73]">
              Quản lý tài khoản và phân quyền người dùng trong hệ thống
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-[#E5E5EA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E3F2FF] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#0071E3]" />
            </div>
            <div>
              <p className="text-[24px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                {users.length}
              </p>
              <p className="text-[12px] text-[#6E6E73]">Tổng người dùng</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E5EA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-[#34C759]" />
            </div>
            <div>
              <p className="text-[24px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                {users.filter((u) => u.status === 'active').length}
              </p>
              <p className="text-[12px] text-[#6E6E73]">Đang hoạt động</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E5EA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFE5E5] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#FF3B30]" />
            </div>
            <div>
              <p className="text-[24px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                1
              </p>
              <p className="text-[12px] text-[#6E6E73]">Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 border transition-all duration-200 flex-1 ${searchFocus ? 'border-[#0071E3] bg-white shadow-sm shadow-[#0071E3]/10' : 'border-[#E5E5EA] bg-[#F5F5F7]'}`}>
            <Search className={`w-4 h-4 flex-shrink-0 ${searchFocus ? 'text-[#0071E3]' : 'text-[#AEAEB2]'}`} />
            <input
              type="text"
              placeholder="Tìm theo tên, email..."
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              className="bg-transparent text-[13px] text-[#1D1D1F] placeholder-[#AEAEB2] outline-none w-full"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[13px] text-[#1D1D1F]"
              style={{ fontWeight: 500 }}
            >
              <Filter className="w-4 h-4" />
              Lọc
            </button>
          </div>

          {/* Add User */}
          <Link
            href="/admin/nguoi-dung/them-moi"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl transition-all shadow-sm text-[13px]"
            style={{ fontWeight: 500 }}
          >
            <Plus className="w-4 h-4" />
            Thêm người dùng
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F2F2F7]">
                <th className="text-left px-6 py-4 text-[11px] uppercase tracking-[0.06em] text-[#AEAEB2]" style={{ fontWeight: 600 }}>
                  Người dùng
                </th>
                <th className="text-left px-6 py-4 text-[11px] uppercase tracking-[0.06em] text-[#AEAEB2]" style={{ fontWeight: 600 }}>
                  Vai trò
                </th>
                <th className="text-left px-6 py-4 text-[11px] uppercase tracking-[0.06em] text-[#AEAEB2]" style={{ fontWeight: 600 }}>
                  Phòng ban
                </th>
                <th className="text-left px-6 py-4 text-[11px] uppercase tracking-[0.06em] text-[#AEAEB2]" style={{ fontWeight: 600 }}>
                  Trạng thái
                </th>
                <th className="text-right px-6 py-4 text-[11px] uppercase tracking-[0.06em] text-[#AEAEB2]" style={{ fontWeight: 600 }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[#F2F2F7] last:border-0 hover:bg-[#F5F5F7] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] flex-shrink-0"
                        style={{ background: user.color, fontFamily: SF, fontWeight: 600 }}
                      >
                        {user.avatar}
                      </div>
                      <div>
                        <p className="text-[14px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{user.name}</p>
                        <p className="text-[12px] text-[#6E6E73]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] ${roleColors[user.role]}`} style={{ fontWeight: 600 }}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[13px] text-[#1D1D1F]">{user.department}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] ${user.status === 'active' ? 'bg-[#E8F5E9] text-[#34C759]' : 'bg-[#F2F2F7] text-[#AEAEB2]'
                        }`}
                      style={{ fontWeight: 600 }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-[#34C759]' : 'bg-[#AEAEB2]'}`} />
                      {user.status === 'active' ? 'Hoạt động' : 'Ngưng'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/nguoi-dung/${user.id}/chinh-sua`}
                        className="p-2 rounded-lg text-[#0071E3] hover:bg-[#EBF3FD] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button className="p-2 rounded-lg text-[#FF3B30] hover:bg-[#FFE5E5] transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
