'use client';

import { useState } from 'react';
import { Cpu, Plus, Trash2, GripVertical, Save } from 'lucide-react';

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif";
const SFT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif";

const defaultCriteria = [
  { id: 1, name: 'Kinh nghiệm làm việc', weight: 30, enabled: true },
  { id: 2, name: 'Kỹ năng kỹ thuật', weight: 25, enabled: true },
  { id: 3, name: 'Trình độ học vấn', weight: 15, enabled: true },
  { id: 4, name: 'Kỹ năng mềm', weight: 20, enabled: true },
  { id: 5, name: 'Ngôn ngữ', weight: 10, enabled: true },
];

export default function AIScreeningConfigPage() {
  const [criteria, setCriteria] = useState(defaultCriteria);
  const [showAddModal, setShowAddModal] = useState(false);

  const totalWeight = criteria.filter((c) => c.enabled).reduce((sum, c) => sum + c.weight, 0);
  const isValid = totalWeight === 100;

  return (
    <div className="p-6 lg:p-8" style={{ fontFamily: SFT }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#0071E3] flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[24px] text-[#1D1D1F] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>
              Cấu hình AI Screening
            </h1>
            <p className="text-[13px] text-[#6E6E73]">
              Thiết lập tiêu chí và trọng số cho hệ thống đánh giá CV tự động
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Config */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>
                Tiêu chí đánh giá
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-[#0071E3] hover:bg-[#EBF3FD] rounded-lg transition-colors text-[13px]"
                style={{ fontWeight: 500 }}
              >
                <Plus className="w-4 h-4" />
                Thêm tiêu chí
              </button>
            </div>

            {/* Weight Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-[#6E6E73]">Tổng trọng số</span>
                <span className={`text-[15px] ${isValid ? 'text-[#34C759]' : 'text-[#FF3B30]'}`} style={{ fontFamily: SF, fontWeight: 700 }}>
                  {totalWeight}/100
                </span>
              </div>
              <div className="h-2 bg-[#F2F2F7] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${isValid ? 'bg-[#34C759]' : totalWeight > 100 ? 'bg-[#FF3B30]' : 'bg-[#FF9500]'}`}
                  style={{ width: `${Math.min(totalWeight, 100)}%` }}
                />
              </div>
              {!isValid && (
                <p className="text-[11px] text-[#FF3B30] mt-1.5">
                  {totalWeight > 100 ? 'Tổng trọng số vượt quá 100%' : 'Tổng trọng số phải bằng 100%'}
                </p>
              )}
            </div>

            {/* Criteria List */}
            <div className="space-y-3">
              {criteria.map((criterion) => (
                <div
                  key={criterion.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${criterion.enabled ? 'border-[#E5E5EA] bg-white' : 'border-[#F2F2F7] bg-[#F5F5F7] opacity-60'}`}
                >
                  <button className="text-[#AEAEB2] cursor-move">
                    <GripVertical className="w-4 h-4" />
                  </button>
                  <div className="flex-1">
                    <p className="text-[14px] text-[#1D1D1F] mb-1" style={{ fontWeight: 500 }}>{criterion.name}</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min="0" max="100" value={criterion.weight}
                        onChange={(e) => setCriteria(criteria.map((c) => c.id === criterion.id ? { ...c, weight: parseInt(e.target.value) } : c))}
                        disabled={!criterion.enabled} className="flex-1"
                      />
                      <input
                        type="number" min="0" max="100" value={criterion.weight}
                        onChange={(e) => setCriteria(criteria.map((c) => c.id === criterion.id ? { ...c, weight: parseInt(e.target.value) || 0 } : c))}
                        disabled={!criterion.enabled}
                        className="w-16 px-2 py-1.5 text-center text-[13px] border border-[#E5E5EA] rounded-lg focus:border-[#0071E3] outline-none"
                      />
                      <span className="text-[13px] text-[#AEAEB2] w-4">%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox" checked={criterion.enabled}
                        onChange={(e) => setCriteria(criteria.map((c) => c.id === criterion.id ? { ...c, enabled: e.target.checked } : c))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#E5E5EA] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0071E3]" />
                    </label>
                    <button onClick={() => setCriteria(criteria.filter((c) => c.id !== criterion.id))} className="p-2 text-[#FF3B30] hover:bg-[#FFE5E5] rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-[#F2F2F7]">
              <button
                disabled={!isValid}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0071E3] hover:bg-[#0077ED] disabled:bg-[#E5E5EA] disabled:text-[#AEAEB2] text-white rounded-xl transition-all shadow-sm text-[14px]"
                style={{ fontWeight: 600 }}
              >
                <Save className="w-4 h-4" />
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#EBF3FD] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-[#0071E3]" />
              </div>
              <div>
                <h3 className="text-[15px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>AI Model</h3>
                <p className="text-[11px] text-[#6E6E73]">Gemini Pro</p>
              </div>
            </div>
            <div className="space-y-2">
              {[['Phiên bản', 'v2.1.0', 'text-[#1D1D1F]'], ['Độ chính xác', '94.5%', 'text-[#34C759]'], ['Cập nhật', '15/02/2024', 'text-[#1D1D1F]']].map(([label, val, cls]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[12px] text-[#6E6E73]">{label}</span>
                  <span className={`text-[12px] ${cls}`} style={{ fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#FFF4E5] rounded-2xl border border-[#FFEED4] p-5">
            <h3 className="text-[14px] text-[#1D1D1F] mb-3" style={{ fontFamily: SF, fontWeight: 600 }}>💡 Gợi ý</h3>
            <ul className="space-y-2 text-[12px] text-[#6E6E73] leading-relaxed">
              <li>• Tổng trọng số phải bằng 100%</li>
              <li>• Tiêu chí quan trọng nhất nên có trọng số 25-35%</li>
              <li>• Nên có 4-6 tiêu chí chính</li>
              <li>• Tắt tiêu chí không cần thiết thay vì xóa</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
            <h3 className="text-[14px] text-[#1D1D1F] mb-4" style={{ fontFamily: SF, fontWeight: 600 }}>Thống kê sử dụng</h3>
            <div className="space-y-3">
              {[['CV đã xử lý', '1,247', 'text-[#1D1D1F]'], ['Thời gian TB', '2.3s', 'text-[#1D1D1F]'], ['Tỉ lệ chấp nhận', '68%', 'text-[#34C759]']].map(([label, val, cls]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[12px] text-[#6E6E73]">{label}</span>
                  <span className={`text-[12px] ${cls}`} style={{ fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-[#F2F2F7]">
              <h2 className="text-[20px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>Thêm tiêu chí mới</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Tên tiêu chí</label>
                <input type="text" placeholder="Ví dụ: Chứng chỉ chuyên môn" className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] outline-none transition-all text-[14px]" />
              </div>
              <div>
                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Trọng số (%)</label>
                <input type="number" min="0" max="100" defaultValue={10} className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] outline-none transition-all text-[14px]" />
              </div>
            </div>
            <div className="p-6 border-t border-[#F2F2F7] flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] transition-colors text-[14px]" style={{ fontWeight: 500 }}>Hủy</button>
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 bg-[#0071E3] text-white rounded-xl transition-all shadow-sm text-[14px]" style={{ fontWeight: 600 }}>Thêm tiêu chí</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
