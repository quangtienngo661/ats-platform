'use client';

import { useState } from 'react';
import { Building2, Plus, Edit2, Trash2, Users } from 'lucide-react';

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif";
const SFT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif";

const departments = [
  { id: 1, name: 'Nhân sự', description: 'Tuyển dụng và quản lý nhân sự', members: 8, color: '#0071E3' },
  { id: 2, name: 'IT', description: 'Phát triển và duy trì hệ thống', members: 12, color: '#34C759' },
  { id: 3, name: 'Marketing', description: 'Tiếp thị và truyền thông', members: 6, color: '#FF9500' },
  { id: 4, name: 'Kinh doanh', description: 'Bán hàng và phát triển kinh doanh', members: 15, color: '#6366F1' },
  { id: 5, name: 'Tài chính', description: 'Kế toán và quản lý tài chính', members: 5, color: '#AF52DE' },
];

export default function DepartmentManagementPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<number | null>(null);

  return (
    <div className="p-6 lg:p-8" style={{ fontFamily: SFT }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0071E3] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[24px] text-[#1D1D1F] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                Quản lý phòng ban
              </h1>
              <p className="text-[13px] text-[#6E6E73]">Cấu trúc tổ chức và phân bổ nhân sự</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl transition-all shadow-sm text-[13px]"
            style={{ fontWeight: 500 }}
          >
            <Plus className="w-4 h-4" />
            Thêm phòng ban
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-[#E5E5EA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E3F2FF] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#0071E3]" />
            </div>
            <div>
              <p className="text-[24px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                {departments.length}
              </p>
              <p className="text-[12px] text-[#6E6E73]">Phòng ban</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E5EA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#34C759]" />
            </div>
            <div>
              <p className="text-[24px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                {departments.reduce((sum, d) => sum + d.members, 0)}
              </p>
              <p className="text-[12px] text-[#6E6E73]">Nhân viên</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E5EA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4E5] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#FF9500]" />
            </div>
            <div>
              <p className="text-[24px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                {Math.round(departments.reduce((sum, d) => sum + d.members, 0) / departments.length)}
              </p>
              <p className="text-[12px] text-[#6E6E73]">TB/Phòng ban</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white rounded-2xl border border-[#E5E5EA] p-5 hover:shadow-lg hover:shadow-black/5 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${dept.color}15` }}
              >
                <Building2 className="w-6 h-6" style={{ color: dept.color }} />
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingDept(dept.id)}
                  className="p-2 rounded-lg text-[#0071E3] hover:bg-[#EBF3FD] transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg text-[#FF3B30] hover:bg-[#FFE5E5] transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-[17px] text-[#1D1D1F] mb-2 tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>
              {dept.name}
            </h3>
            <p className="text-[13px] text-[#6E6E73] leading-relaxed mb-4">{dept.description}</p>

            <div className="flex items-center justify-between pt-4 border-t border-[#F2F2F7]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#AEAEB2]" />
                <span className="text-[13px] text-[#6E6E73]">{dept.members} thành viên</span>
              </div>
              <button className="text-[12px] text-[#0071E3] hover:underline" style={{ fontWeight: 500 }}>
                Xem chi tiết →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-[#F2F2F7]">
              <h2 className="text-[20px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>
                Thêm phòng ban mới
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                  Tên phòng ban
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên phòng ban"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]"
                />
              </div>
              <div>
                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                  Mô tả
                </label>
                <textarea
                  placeholder="Mô tả chức năng và nhiệm vụ"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px] resize-none"
                />
              </div>
              <div>
                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                  Màu đại diện
                </label>
                <div className="flex gap-2">
                  {['#0071E3', '#34C759', '#FF9500', '#6366F1', '#AF52DE', '#FF3B30'].map((color) => (
                    <button
                      key={color}
                      className="w-10 h-10 rounded-xl hover:scale-110 transition-transform border-2 border-transparent hover:border-[#E5E5EA]"
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#F2F2F7] flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[14px]"
                style={{ fontWeight: 500 }}
              >
                Hủy
              </button>
              <button
                className="flex-1 px-4 py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl transition-all shadow-sm text-[14px]"
                style={{ fontWeight: 600 }}
              >
                Tạo phòng ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
