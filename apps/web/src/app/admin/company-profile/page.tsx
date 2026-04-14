'use client';

import { useState } from 'react';
import { Building2, Upload, Save, MapPin, Phone, Mail, Globe } from 'lucide-react';

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif";
const SFT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif";

export default function CompanySettingsPage() {
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  return (
    <div className="p-6 lg:p-8" style={{ fontFamily: SFT }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#0071E3] flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[24px] text-[#1D1D1F] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>
              Thông tin công ty
            </h1>
            <p className="text-[13px] text-[#6E6E73]">Quản lý thông tin và cài đặt chung của tổ chức</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Profile */}
          <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
            <h2 className="text-[17px] text-[#1D1D1F] mb-5 tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>
              Hồ sơ công ty
            </h2>
            {/* Logo Upload */}
            <div className="mb-6">
              <label className="block text-[13px] text-[#1D1D1F] mb-3" style={{ fontWeight: 500 }}>Logo công ty</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-[#0071E3] flex items-center justify-center text-white text-[24px] flex-shrink-0" style={{ fontFamily: SF, fontWeight: 700 }}>
                  A
                </div>
                <div className="flex-1">
                  <button className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E5EA] hover:bg-[#F5F5F7] rounded-xl transition-colors text-[13px]" style={{ fontWeight: 500 }}>
                    <Upload className="w-4 h-4" />
                    Tải ảnh lên
                  </button>
                  <p className="text-[11px] text-[#6E6E73] mt-2">JPG, PNG hoặc SVG. Tối đa 2MB.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Tên công ty</label>
                  <input type="text" defaultValue="Acme Corporation" className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]" />
                </div>
                <div>
                  <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Mã số thuế</label>
                  <input type="text" defaultValue="0123456789" className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Lĩnh vực hoạt động</label>
                <select className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]">
                  <option>Công nghệ thông tin</option>
                  <option>Tài chính - Ngân hàng</option>
                  <option>Y tế - Chăm sóc sức khỏe</option>
                  <option>Giáo dục - Đào tạo</option>
                  <option>Sản xuất - Chế tạo</option>
                  <option>Thương mại điện tử</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Về công ty</label>
                <textarea
                  rows={4}
                  defaultValue="Acme Corporation là công ty công nghệ hàng đầu chuyên về phát triển giải pháp AI cho doanh nghiệp. Với đội ngũ hơn 500 nhân viên tài năng, chúng tôi cam kết mang đến những sản phẩm và dịch vụ tốt nhất cho khách hàng."
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
            <h2 className="text-[17px] text-[#1D1D1F] mb-5 tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>Thông tin liên hệ</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                  <MapPin className="w-4 h-4 inline mr-1.5" />Địa chỉ
                </label>
                <input type="text" defaultValue="123 Nguyễn Huệ, Quận 1, TP.HCM" className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                    <Phone className="w-4 h-4 inline mr-1.5" />Số điện thoại
                  </label>
                  <input type="tel" defaultValue="+84 28 1234 5678" className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]" />
                </div>
                <div>
                  <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                    <Mail className="w-4 h-4 inline mr-1.5" />Email
                  </label>
                  <input type="email" defaultValue="contact@acme.com" className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>
                  <Globe className="w-4 h-4 inline mr-1.5" />Website
                </label>
                <input type="url" defaultValue="https://acme.com" className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]" />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
            <h2 className="text-[17px] text-[#1D1D1F] mb-5 tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>Mạng xã hội</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>LinkedIn</label>
                <input type="url" placeholder="https://linkedin.com/company/acme" className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]" />
              </div>
              <div>
                <label className="block text-[13px] text-[#1D1D1F] mb-2" style={{ fontWeight: 500 }}>Facebook</label>
                <input type="url" placeholder="https://facebook.com/acme" className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]" />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button className="px-6 py-3 border border-[#E5E5EA] hover:bg-[#F5F5F7] rounded-xl transition-colors text-[14px]" style={{ fontWeight: 500 }}>
              Hủy thay đổi
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#0071E3] hover:bg-[#0077ED] disabled:bg-[#E5E5EA] disabled:text-[#AEAEB2] text-white rounded-xl transition-all shadow-sm text-[14px]"
              style={{ fontWeight: 600 }}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
            <h3 className="text-[15px] text-[#1D1D1F] mb-4" style={{ fontFamily: SF, fontWeight: 600 }}>Thống kê công ty</h3>
            <div className="space-y-3">
              {[['Nhân viên', '524'], ['Phòng ban', '8'], ['Vị trí đang tuyển', '12'], ['Thành lập', '2018']].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[13px] text-[#6E6E73]">{label}</span>
                  <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
            <h3 className="text-[15px] text-[#1D1D1F] mb-4" style={{ fontFamily: SF, fontWeight: 600 }}>Thao tác nhanh</h3>
            <div className="space-y-2">
              {['Xem trang công ty công khai', 'Quản lý branding', 'Xuất dữ liệu công ty'].map((label) => (
                <button key={label} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#F5F5F7] transition-colors text-[13px] text-[#1D1D1F]">
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#EBF3FD] rounded-2xl border border-[#D6E9FA] p-5">
            <h3 className="text-[14px] text-[#1D1D1F] mb-3" style={{ fontFamily: SF, fontWeight: 600 }}>💡 Lời khuyên</h3>
            <ul className="space-y-2 text-[12px] text-[#6E6E73] leading-relaxed">
              <li>• Cập nhật đầy đủ thông tin để ứng viên hiểu rõ về công ty</li>
              <li>• Logo nên rõ ràng và chuyên nghiệp</li>
              <li>• Mô tả công ty ngắn gọn nhưng thu hút</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
