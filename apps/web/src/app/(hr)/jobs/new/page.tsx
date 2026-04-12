'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Sparkles, Wand2, X } from 'lucide-react';

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif";
const SFT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif";

export default function JobPostingFormPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', requirements: '', benefits: '' });

  const handleAiGenerate = (_field: string) => {
    setAiGenerating(true);
    setTimeout(() => { setAiGenerating(false); setShowAiSuggestion(true); }, 2000);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { router.push('/jobs'); }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]" style={{ fontFamily: SFT }}>
      {/* Header */}
      <div className="bg-white border-b border-[#E5E5EA] sticky top-0 z-10 shadow-sm">
        <div className="px-6 lg:px-8 py-4">
          <Link href="/jobs" className="inline-flex items-center gap-2 text-[13px] text-[#6E6E73] hover:text-[#0071E3] mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />Quay lại danh sách
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[22px] text-[#1D1D1F] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                Tạo tin tuyển dụng mới
              </h1>
              <p className="text-[13px] text-[#6E6E73]">Sử dụng AI để tạo nội dung chuyên nghiệp</p>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] disabled:bg-[#E5E5EA] disabled:text-[#AEAEB2] text-white rounded-xl transition-all shadow-sm text-[14px]"
              style={{ fontWeight: 600 }}>
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Xuất bản'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
              <h2 className="text-[17px] text-[#1D1D1F] mb-5 tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>
                Thông tin cơ bản
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Tiêu đề vị trí</label>
                  <input type="text" placeholder="Ví dụ: Senior Frontend Developer"
                    value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Phòng ban</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]">
                      <option>IT</option><option>Nhân sự</option><option>Marketing</option><option>Kinh doanh</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Loại hình</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]">
                      <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Địa điểm</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] outline-none transition-all text-[14px]">
                      <option>TP.HCM</option><option>Hà Nội</option><option>Đà Nẵng</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Kinh nghiệm</label>
                    <input type="text" placeholder="Ví dụ: 3-5 năm" className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] outline-none transition-all text-[14px]" />
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Số lượng</label>
                    <input type="number" defaultValue="1" className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] outline-none transition-all text-[14px]" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Mức lương từ ($)</label>
                    <input type="number" placeholder="2000" className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] outline-none transition-all text-[14px]" />
                  </div>
                  <div>
                    <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Mức lương đến ($)</label>
                    <input type="number" placeholder="3000" className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] outline-none transition-all text-[14px]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {[
              { key: 'description' as const, label: 'Mô tả công việc', placeholder: 'Mô tả chi tiết về công việc...' },
              { key: 'requirements' as const, label: 'Yêu cầu ứng viên', placeholder: '• Yêu cầu 1\n• Yêu cầu 2' },
              { key: 'benefits' as const, label: 'Quyền lợi', placeholder: '• Quyền lợi 1\n• Quyền lợi 2' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[17px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>{label}</h2>
                  <button onClick={() => handleAiGenerate(key)} disabled={aiGenerating}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#0071E3] to-[#0056B3] hover:from-[#0077ED] hover:to-[#0062C4] disabled:from-[#E5E5EA] disabled:to-[#E5E5EA] text-white rounded-lg transition-all text-[12px]"
                    style={{ fontWeight: 500 }}>
                    <Wand2 className={`w-3.5 h-3.5 ${aiGenerating ? 'animate-spin' : ''}`} />
                    {aiGenerating ? 'Đang tạo...' : 'Tạo với AI'}
                  </button>
                </div>
                <textarea rows={6} placeholder={placeholder}
                  value={formData[key]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px] resize-none" />
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#0071E3] to-[#0056B3] rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-[17px]" style={{ fontFamily: SF, fontWeight: 600 }}>AI Assistant</h3>
              </div>
              <p className="text-[13px] text-white/90 leading-relaxed mb-4">
                Sử dụng AI để tự động tạo nội dung chuyên nghiệp, tối ưu cho SEO và thu hút ứng viên chất lượng.
              </p>
              {['Tự động tối ưu từ khóa', 'Ngôn ngữ chuyên nghiệp', 'Phân tích xu hướng thị trường'].map(t => (
                <div key={t} className="flex items-center gap-2 text-[12px] mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>{t}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
              <h3 className="text-[15px] text-[#1D1D1F] mb-4" style={{ fontFamily: SF, fontWeight: 600 }}>💡 Gợi ý</h3>
              <ul className="space-y-2 text-[12px] text-[#6E6E73] leading-relaxed">
                {['Tiêu đề nên ngắn gọn, rõ ràng', 'Mô tả công việc cụ thể, dễ hiểu', 'Yêu cầu thực tế, không quá khắt khe', 'Nêu rõ quyền lợi để thu hút ứng viên'].map(tip => (
                  <li key={tip}>• {tip}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
              <h3 className="text-[15px] text-[#1D1D1F] mb-4" style={{ fontFamily: SF, fontWeight: 600 }}>Trạng thái</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#6E6E73]">Trạng thái</span>
                  <span className="text-[13px] text-[#FF9500]" style={{ fontWeight: 600 }}>Bản nháp</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#6E6E73]">Tạo bởi</span>
                  <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>Alex Johnson</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Suggestion Modal */}
      {showAiSuggestion && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-[#F2F2F7]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0071E3] to-[#0056B3] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-[20px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>Gợi ý từ AI</h2>
                </div>
                <button onClick={() => setShowAiSuggestion(false)} className="p-2 hover:bg-[#F5F5F7] rounded-lg transition-colors">
                  <X className="w-4 h-4 text-[#6E6E73]" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-[#F5F5F7] rounded-2xl p-5 mb-4">
                <p className="text-[14px] text-[#1D1D1F] leading-relaxed">
                  Chúng tôi đang tìm kiếm một Senior Frontend Developer có kinh nghiệm để tham gia vào đội ngũ phát triển sản phẩm.
                  Bạn sẽ chịu trách nhiệm xây dựng và duy trì các ứng dụng web hiện đại, làm việc với React, TypeScript và các công nghệ tiên tiến nhất.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAiSuggestion(false)}
                  className="flex-1 px-4 py-3 border border-[#E5E5EA] hover:bg-[#F5F5F7] rounded-xl transition-colors text-[14px]" style={{ fontWeight: 500 }}>
                  Tạo lại
                </button>
                <button onClick={() => { setFormData({ ...formData, description: 'Chúng tôi đang tìm kiếm một Senior Frontend Developer...' }); setShowAiSuggestion(false); }}
                  className="flex-1 px-4 py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl transition-all shadow-sm text-[14px]" style={{ fontWeight: 600 }}>
                  Sử dụng gợi ý này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
