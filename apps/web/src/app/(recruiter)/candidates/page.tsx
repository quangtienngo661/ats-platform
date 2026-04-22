'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, Users, Star, TrendingUp, Eye, ChevronRight } from 'lucide-react';

const SF  = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif";
const SFT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif";

const candidates = [
  { id: 1, name: 'Nguyễn Văn An',   position: 'Senior Frontend Developer', score: 92, status: 'new',       applied: '2 giờ trước',  avatar: 'NA', exp: '5 năm', location: 'TP.HCM' },
  { id: 2, name: 'Trần Thị Bình',   position: 'Product Designer',          score: 88, status: 'screening', applied: '5 giờ trước',  avatar: 'TB', exp: '3 năm', location: 'Hà Nội' },
  { id: 3, name: 'Lê Minh Cường',   position: 'Backend Engineer',          score: 95, status: 'interview', applied: '1 ngày trước', avatar: 'LC', exp: '6 năm', location: 'TP.HCM' },
  { id: 4, name: 'Phạm Thu Dung',   position: 'HR Manager',                score: 85, status: 'offer',     applied: '2 ngày trước', avatar: 'PD', exp: '8 năm', location: 'Đà Nẵng' },
  { id: 5, name: 'Hoàng Văn Em',    position: 'DevOps Engineer',           score: 90, status: 'new',       applied: '3 giờ trước',  avatar: 'HE', exp: '4 năm', location: 'TP.HCM' },
  { id: 6, name: 'Vũ Thị Hương',    position: 'Data Analyst',              score: 87, status: 'screening', applied: '1 ngày trước', avatar: 'VH', exp: '3 năm', location: 'Hà Nội' },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new:       { label: 'Mới',       color: '#0071E3', bg: '#E3F2FF' },
  screening: { label: 'Sàng lọc', color: '#FF9500', bg: '#FFF4E5' },
  interview: { label: 'Phỏng vấn',color: '#6366F1', bg: '#EEF2FF' },
  offer:     { label: 'Offer',     color: '#34C759', bg: '#E8F5E9' },
};

const avatarColors = ['#0071E3','#6366F1','#34C759','#FF9500','#0EA5E9','#8B5CF6'];

export default function CandidateListPage() {
  const [searchFocus, setSearchFocus]     = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filtered = selectedFilter === 'all'
    ? candidates
    : candidates.filter(c => c.status === selectedFilter);

  return (
    <div className="p-4 lg:p-6" style={{ fontFamily: SFT }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[13px] text-[#AEAEB2]">HR Portal</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#AEAEB2]" />
        <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>Ứng viên</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] text-[#1D1D1F] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>Danh sách ứng viên</h1>
          <p className="text-[13px] text-[#6E6E73] mt-0.5">Quản lý và đánh giá hồ sơ ứng viên</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Users,     bg: '#E3F2FF', color: '#0071E3', value: candidates.length, label: 'Tổng ứng viên' },
          { icon: Star,      bg: '#E3F2FF', color: '#0071E3', value: candidates.filter(c => c.status === 'new').length, label: 'Ứng viên mới' },
          { icon: TrendingUp,bg: '#FFF4E5', color: '#FF9500', value: 89, label: 'Điểm TB' },
          { icon: Star,      bg: '#E8F5E9', color: '#34C759', value: candidates.filter(c => c.score >= 90).length, label: 'Điểm cao (≥90)' },
        ].map(({ icon: Icon, bg, color, value, label }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-[#F2F2F7] hover:shadow-md hover:shadow-black/5 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-[22px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 700 }}>{value}</p>
                <p className="text-[12px] text-[#6E6E73]">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#F2F2F7] p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 border transition-all duration-200 flex-1 ${searchFocus ? 'border-[#0071E3] bg-white shadow-sm shadow-[#0071E3]/10' : 'border-[#E5E5EA] bg-[#F5F5F7]'}`}>
            <Search className={`w-4 h-4 flex-shrink-0 ${searchFocus ? 'text-[#0071E3]' : 'text-[#AEAEB2]'}`} />
            <input type="text" placeholder="Tìm theo tên, vị trí, kỹ năng..."
              onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
              className="bg-transparent text-[13px] text-[#1D1D1F] placeholder-[#AEAEB2] outline-none w-full" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'Tất cả', count: candidates.length },
              { key: 'new', label: 'Mới', count: candidates.filter(c => c.status === 'new').length },
              { key: 'screening', label: 'Sàng lọc', count: candidates.filter(c => c.status === 'screening').length },
              { key: 'interview', label: 'Phỏng vấn', count: candidates.filter(c => c.status === 'interview').length },
            ].map(f => (
              <button key={f.key} onClick={() => setSelectedFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-xl transition-all text-[13px] flex items-center gap-2 ${
                  selectedFilter === f.key ? 'bg-[#1D1D1F] text-white' : 'bg-white border border-[#E5E5EA] text-[#6E6E73] hover:border-[#D2D2D7]'
                }`}
                style={{ fontWeight: selectedFilter === f.key ? 500 : 400 }}>
                {f.label}
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${selectedFilter === f.key ? 'bg-white/20' : 'bg-[#E5E5EA]'}`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E5EA] hover:bg-[#F5F5F7] rounded-xl transition-colors text-[13px]" style={{ fontWeight: 500 }}>
            <Download className="w-4 h-4" />Xuất Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#F2F2F7] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F2F2F7]">
                {['Ứng viên','Vị trí ứng tuyển','Điểm AI','Trạng thái','Thời gian',''].map((th, i) => (
                  <th key={i} className={`${i === 5 ? 'text-right' : 'text-left'} px-6 py-4 text-[11px] uppercase tracking-[0.06em] text-[#AEAEB2]`} style={{ fontWeight: 600 }}>{th}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((candidate, idx) => (
                <tr key={candidate.id} className="border-b border-[#F2F2F7] last:border-0 hover:bg-[#F5F5F7] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] flex-shrink-0"
                        style={{ background: avatarColors[idx % avatarColors.length], fontFamily: SF, fontWeight: 600 }}>
                        {candidate.avatar}
                      </div>
                      <div>
                        <Link href={`/candidates/${candidate.id}`}
                          className="text-[14px] text-[#1D1D1F] hover:text-[#0071E3] transition-colors" style={{ fontWeight: 500 }}>
                          {candidate.name}
                        </Link>
                        <p className="text-[12px] text-[#6E6E73]">{candidate.exp} • {candidate.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[13px] text-[#1D1D1F]">{candidate.position}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-[15px] ${
                        candidate.score >= 90 ? 'bg-[#E8F5E9] text-[#34C759]' :
                        candidate.score >= 80 ? 'bg-[#E3F2FF] text-[#0071E3]' : 'bg-[#FFF4E5] text-[#FF9500]'
                      }`} style={{ fontFamily: SF, fontWeight: 700 }}>
                        {candidate.score}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < Math.floor(candidate.score / 20) ? 'text-[#FF9500] fill-[#FF9500]' : 'text-[#E5E5EA] fill-[#E5E5EA]'}`} />
                          ))}
                        </div>
                        <span className="text-[10px] text-[#AEAEB2]">
                          {candidate.score >= 90 ? 'Xuất sắc' : candidate.score >= 80 ? 'Tốt' : 'Khá'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px]"
                      style={{ background: statusConfig[candidate.status].bg, color: statusConfig[candidate.status].color, fontWeight: 600 }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusConfig[candidate.status].color }} />
                      {statusConfig[candidate.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[13px] text-[#6E6E73]">{candidate.applied}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/candidates/${candidate.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#EBF3FD] hover:bg-[#D6E9FA] text-[#0071E3] rounded-lg transition-colors text-[12px]"
                        style={{ fontWeight: 500 }}>
                        <Eye className="w-3.5 h-3.5" />Xem chi tiết
                      </Link>
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
