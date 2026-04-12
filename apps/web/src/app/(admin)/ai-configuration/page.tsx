'use client';

import { useState } from 'react';
import { Cpu, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfigProfile } from '../../../types/interfaces/configProfile.interface';
import { ConfigCard } from './components/ConfigCard';
import { AddProfileModal } from './components/AddProfileModal';

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif";
const SFT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif";

// ── Seed Data ──────────────────────────────────────────────────────────────────
const seedProfiles: ConfigProfile[] = [
  {
    id: 1,
    name: 'Cấu hình mặc định',
    description: 'Bộ tiêu chí tiêu chuẩn áp dụng cho tất cả vị trí',
    isDefault: true,
    collapsed: false,
    skillsWeight: 40,
    experienceWeight: 40,
    educationWeight: 20,
    minimumScoreThreshold: 60
  },
  {
    id: 2,
    name: 'Vị trí kỹ thuật',
    description: 'Ưu tiên kỹ năng và kinh nghiệm cho Engineering',
    isDefault: false,
    collapsed: true,
    skillsWeight: 50,
    experienceWeight: 35,
    educationWeight: 15,
    minimumScoreThreshold: 70
  },
];

let nextProfileId = 3;

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AIScreeningConfigPage() {
  const [profiles, setProfiles] = useState<ConfigProfile[]>(seedProfiles);
  const [showModal, setShowModal] = useState(false);

  const updateProfile = (updated: ConfigProfile) =>
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  const deleteProfile = (id: number) =>
    setProfiles((prev) => prev.filter((p) => p.id !== id));

  const setDefault = (id: number) =>
    setProfiles((prev) => prev.map((p) => ({ ...p, isDefault: p.id === id })));

  const duplicateProfile = (source: ConfigProfile) =>
    setProfiles((prev) => [...prev, {
      ...source,
      id: nextProfileId++,
      name: `${source.name} (bản sao)`,
      isActive: false, isDefault: false, collapsed: false,
    }]);

  const handleAdd = (p: ConfigProfile) => {
    setProfiles((prev) => [...prev, p]);
    setShowModal(false);
  };

  return (
    <div className="p-6 lg:p-8" style={{ fontFamily: SFT }}>
      {/* ── Page header ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0071E3] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[24px] text-[#1D1D1F] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                Cấu hình AI Screening
              </h1>
              <p className="text-[13px] text-[#6E6E73]">
                Quản lý các bộ tiêu chí đánh giá CV — {profiles.length} cấu hình
              </p>
            </div>
          </div>

          {/* ── [CHANGED] Nút mở popup thay vì append trực tiếp ── */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl transition-all shadow-sm text-[13px]"
            style={{ fontWeight: 500 }}
          >
            <Plus className="w-4 h-4" />Thêm cấu hình mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Config list ── */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {profiles.map((profile) => (
              <ConfigCard
                key={profile.id}
                profile={profile}
                onUpdate={updateProfile}
                onDelete={() => deleteProfile(profile.id)}
                onSetDefault={() => setDefault(profile.id)}
                onDuplicate={() => duplicateProfile(profile)}
              />
            ))}
          </AnimatePresence>

          {profiles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-[#D2D2D7]">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF3FD] flex items-center justify-center mb-4">
                <Cpu className="w-6 h-6 text-[#0071E3]" />
              </div>
              <p className="text-[15px] text-[#1D1D1F] mb-1" style={{ fontFamily: SF, fontWeight: 600 }}>Chưa có cấu hình nào</p>
              <p className="text-[13px] text-[#AEAEB2] mb-4">Nhấn nút bên dưới để tạo cấu hình đầu tiên</p>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0071E3] text-white rounded-xl text-[13px] hover:bg-[#0077ED] transition-colors"
                style={{ fontWeight: 500 }}
              >
                <Plus className="w-4 h-4" />Thêm cấu hình mới
              </button>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
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

          <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
            <h3 className="text-[14px] text-[#1D1D1F] mb-4" style={{ fontFamily: SF, fontWeight: 600 }}>Tổng quan</h3>
            <div className="space-y-3">
              {[
                ['Tổng cấu hình', `${profiles.length}`, 'text-[#1D1D1F]'],
              ].map(([label, val, cls]) => (
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
              <li>• Tổng 3 trọng số phải đúng bằng 100%</li>
              <li>• Dùng "Nhân bản" để tạo biến thể nhanh</li>
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

      {/* ── [NEW] Add Profile Modal ── */}
      <AnimatePresence>
        {showModal && (
          <AddProfileModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
        )}
      </AnimatePresence>
    </div>
  );
}
