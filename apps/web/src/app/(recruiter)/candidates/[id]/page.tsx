'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Download, Mail, Phone, MapPin, Calendar, Briefcase,
  GraduationCap, Award, Star, CheckCircle, X, MessageSquare, TrendingUp, FileText,
} from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';

const aiScoring = {
  overall: 92,
  breakdown: [
    { criteria: 'Kinh nghiệm làm việc', score: 95, weight: 30, details: '5 năm kinh nghiệm với React, Vue, Angular' },
    { criteria: 'Kỹ năng kỹ thuật', score: 90, weight: 25, details: 'Thành thạo JavaScript, TypeScript, Node.js' },
    { criteria: 'Trình độ học vấn', score: 88, weight: 15, details: 'Cử nhân Khoa học Máy tính - ĐH Bách Khoa' },
    { criteria: 'Kỹ năng mềm', score: 92, weight: 20, details: 'Làm việc nhóm tốt, giao tiếp hiệu quả' },
    { criteria: 'Ngôn ngữ', score: 95, weight: 10, details: 'Tiếng Anh TOEIC 850' },
  ],
  strengths: [
    'Kinh nghiệm vững vàng với React và các framework hiện đại',
    'Đã lead nhiều dự án lớn tại các công ty công nghệ',
    'Kỹ năng giải quyết vấn đề xuất sắc',
  ],
  weaknesses: [
    'Chưa có kinh nghiệm với mobile development',
    'Thiếu certification về cloud computing',
  ],
};

export default function CandidateDetailPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-score' | 'notes'>('overview');

  return (
    <div className="min-h-screen bg-[#F5F5F7]" style={{ fontFamily: SFT }}>
      {/* Header */}
      <div className="bg-white border-b border-[#E5E5EA] sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-4">
          <Link href="/candidates" className="inline-flex items-center gap-2 text-[13px] text-[#6E6E73] hover:text-[#0071E3] mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />Quay lại danh sách
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#0071E3] flex items-center justify-center text-white text-[20px] flex-shrink-0" style={{ fontFamily: SF, fontWeight: 700 }}>
                NA
              </div>
              <div>
                <h1 className="text-[24px] text-[#1D1D1F] mb-1 tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>Nguyễn Văn An</h1>
                <p className="text-[15px] text-[#6E6E73] mb-2">Senior Frontend Developer</p>
                <div className="flex items-center gap-4 text-[13px] text-[#6E6E73]">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />nguyen.an@email.com</span>
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />+84 901 234 567</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />TP.HCM</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E5EA] hover:bg-[#F5F5F7] rounded-xl transition-colors text-[13px]" style={{ fontWeight: 500 }}>
                <Download className="w-4 h-4" />Tải CV
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl transition-all shadow-sm text-[13px]" style={{ fontWeight: 500 }}>
                <MessageSquare className="w-4 h-4" />Liên hệ
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 lg:px-8 flex gap-1 border-t border-[#F2F2F7]">
          {[
            { key: 'overview' as const, label: 'Tổng quan', icon: FileText },
            { key: 'ai-score' as const, label: 'Đánh giá AI', icon: TrendingUp },
            { key: 'notes' as const, label: 'Ghi chú nội bộ', icon: MessageSquare },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-[13px] border-b-2 transition-all ${activeTab === key ? 'border-[#0071E3] text-[#0071E3]' : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'
                }`} style={{ fontWeight: activeTab === key ? 600 : 500 }}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* Experience */}
                <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="w-5 h-5 text-[#0071E3]" />
                    <h2 className="text-[17px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>Kinh nghiệm làm việc</h2>
                  </div>
                  <div className="space-y-4">
                    {[
                      { company: 'TechCorp Vietnam', role: 'Senior Frontend Developer', period: '2021 - Hiện tại', desc: 'Lead team 5 người phát triển web app cho khách hàng quốc tế' },
                      { company: 'Digital Solutions', role: 'Frontend Developer', period: '2019 - 2021', desc: 'Phát triển các tính năng mới cho nền tảng e-commerce' },
                      { company: 'StartupXYZ', role: 'Junior Developer', period: '2018 - 2019', desc: 'Xây dựng giao diện responsive cho web và mobile' },
                    ].map((job, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-5 h-5 text-[#6E6E73]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-[14px] text-[#1D1D1F] mb-0.5" style={{ fontWeight: 600 }}>{job.role}</h3>
                          <p className="text-[13px] text-[#0071E3] mb-1" style={{ fontWeight: 500 }}>{job.company}</p>
                          <p className="text-[12px] text-[#AEAEB2] mb-2">{job.period}</p>
                          <p className="text-[13px] text-[#6E6E73] leading-relaxed">{job.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="w-5 h-5 text-[#0071E3]" />
                    <h2 className="text-[17px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>Học vấn</h2>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-[#6E6E73]" />
                    </div>
                    <div>
                      <h3 className="text-[14px] text-[#1D1D1F] mb-0.5" style={{ fontWeight: 600 }}>Cử nhân Khoa học Máy tính</h3>
                      <p className="text-[13px] text-[#0071E3] mb-1" style={{ fontWeight: 500 }}>ĐH Bách Khoa TP.HCM</p>
                      <p className="text-[12px] text-[#AEAEB2]">2014 - 2018 • GPA: 3.6/4.0</p>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-[#0071E3]" />
                    <h2 className="text-[17px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>Kỹ năng</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['React', 'Vue.js', 'Angular', 'TypeScript', 'Node.js', 'GraphQL', 'Next.js', 'Tailwind CSS', 'Git', 'Agile/Scrum'].map(skill => (
                      <span key={skill} className="px-3 py-1.5 bg-[#F5F5F7] text-[#1D1D1F] rounded-lg text-[12px]" style={{ fontWeight: 500 }}>{skill}</span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'ai-score' && (
              <>
                {/* Overall Score */}
                <div className="bg-gradient-to-br from-[#0071E3] to-[#0056B3] rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-[13px] text-white/80 mb-1">Điểm tổng thể</p>
                      <h2 className="text-[48px] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>{aiScoring.overall}</h2>
                    </div>
                    <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center">
                      <TrendingUp className="w-10 h-10" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-6 h-6 ${i < Math.floor(aiScoring.overall / 20) ? 'fill-white text-white' : 'fill-white/20 text-white/20'}`} />
                    ))}
                  </div>
                </div>

                {/* Breakdown */}
                <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
                  <h2 className="text-[17px] text-[#1D1D1F] mb-5 tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>Chi tiết đánh giá</h2>
                  <div className="space-y-5">
                    {aiScoring.breakdown.map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[14px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{item.criteria}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-[#AEAEB2]">Trọng số {item.weight}%</span>
                            <span className="text-[15px] text-[#0071E3]" style={{ fontFamily: SF, fontWeight: 700 }}>{item.score}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-[#F2F2F7] rounded-full overflow-hidden mb-2">
                          <div className={`h-full ${item.score >= 90 ? 'bg-[#34C759]' : item.score >= 80 ? 'bg-[#0071E3]' : 'bg-[#FF9500]'}`}
                            style={{ width: `${item.score}%` }} />
                        </div>
                        <p className="text-[12px] text-[#6E6E73] leading-relaxed">{item.details}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#E8F5E9] rounded-2xl border border-[#C8E6C9] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-[#34C759]" />
                      <h3 className="text-[15px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>Điểm mạnh</h3>
                    </div>
                    <ul className="space-y-2">
                      {aiScoring.strengths.map((s, i) => (
                        <li key={i} className="text-[13px] text-[#1D1D1F] leading-relaxed flex gap-2">
                          <span className="text-[#34C759]">•</span><span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-[#FFF4E5] rounded-2xl border border-[#FFEED4] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <X className="w-5 h-5 text-[#FF9500]" />
                      <h3 className="text-[15px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>Cần cải thiện</h3>
                    </div>
                    <ul className="space-y-2">
                      {aiScoring.weaknesses.map((w, i) => (
                        <li key={i} className="text-[13px] text-[#1D1D1F] leading-relaxed flex gap-2">
                          <span className="text-[#FF9500]">•</span><span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'notes' && (
              <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
                <h2 className="text-[17px] text-[#1D1D1F] mb-4 tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>Ghi chú nội bộ</h2>
                <div className="space-y-4 mb-6">
                  {[
                    { author: 'Alex Johnson', time: '2 giờ trước', note: 'Ứng viên rất phù hợp với vị trí Senior Frontend. Recommend schedule interview.' },
                    { author: 'Sarah Chen', time: '1 ngày trước', note: 'CV ấn tượng, kinh nghiệm solid với React ecosystem.' },
                  ].map((note, i) => (
                    <div key={i} className="flex gap-3 p-4 bg-[#F5F5F7] rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-[#0071E3] flex items-center justify-center text-white text-[11px] flex-shrink-0" style={{ fontFamily: SF, fontWeight: 600 }}>
                        {note.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 600 }}>{note.author}</span>
                          <span className="text-[11px] text-[#AEAEB2]">{note.time}</span>
                        </div>
                        <p className="text-[13px] text-[#6E6E73] leading-relaxed">{note.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <textarea placeholder="Thêm ghi chú..." rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px] resize-none mb-3" />
                  <button className="px-4 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl transition-all shadow-sm text-[13px]" style={{ fontWeight: 600 }}>
                    Thêm ghi chú
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
              <h3 className="text-[15px] text-[#1D1D1F] mb-4" style={{ fontFamily: SF, fontWeight: 600 }}>Thao tác nhanh</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2.5 bg-[#EBF3FD] hover:bg-[#D6E9FA] text-[#0071E3] rounded-xl transition-colors text-[13px]" style={{ fontWeight: 500 }}>
                  Chuyển sang Phỏng vấn
                </button>
                <button className="w-full px-4 py-2.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#34C759] rounded-xl transition-colors text-[13px]" style={{ fontWeight: 500 }}>
                  Gửi Offer
                </button>
                <button className="w-full px-4 py-2.5 bg-[#FFE5E5] hover:bg-[#FFD4D4] text-[#FF3B30] rounded-xl transition-colors text-[13px]" style={{ fontWeight: 500 }}>
                  Từ chối
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5">
              <h3 className="text-[15px] text-[#1D1D1F] mb-4" style={{ fontFamily: SF, fontWeight: 600 }}>Lịch sử hoạt động</h3>
              <div className="space-y-3">
                {[
                  { event: 'Nộp đơn ứng tuyển', time: '2 giờ trước', icon: Calendar },
                  { event: 'CV được AI đánh giá', time: '2 giờ trước', icon: TrendingUp },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-[#6E6E73]" />
                      </div>
                      <div>
                        <p className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{item.event}</p>
                        <p className="text-[11px] text-[#AEAEB2]">{item.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
