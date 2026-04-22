'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Plus, MapPin, Clock, Users, Eye, Edit3, Trash2, ChevronRight,
  Briefcase, Zap, CheckCircle, XCircle,
} from 'lucide-react';

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif";
const SFT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif";

interface Job {
  id: string; title: string; department: string; location: string; type: string;
  applicants: number; views: number; posted: string; status: 'active' | 'draft' | 'closed';
  aiScore: number; tags: string[];
}

const jobs: Job[] = [
  { id: 'j1', title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Hà Nội (Hybrid)', type: 'Full-time', applicants: 47, views: 312, posted: '2 ngày trước', status: 'active', aiScore: 96, tags: ['React', 'TypeScript', 'Next.js'] },
  { id: 'j2', title: 'Product Manager', department: 'Product', location: 'TP.HCM (Remote)', type: 'Full-time', applicants: 31, views: 201, posted: '5 ngày trước', status: 'active', aiScore: 88, tags: ['B2B SaaS', 'Agile', 'OKR'] },
  { id: 'j3', title: 'UX/UI Designer', department: 'Design', location: 'Hà Nội (Office)', type: 'Full-time', applicants: 28, views: 184, posted: '1 tuần trước', status: 'active', aiScore: 91, tags: ['Figma', 'User Research', 'Motion'] },
  { id: 'j4', title: 'Data Scientist', department: 'Data', location: 'TP.HCM (Hybrid)', type: 'Full-time', applicants: 19, views: 143, posted: '1 tuần trước', status: 'active', aiScore: 85, tags: ['Python', 'ML', 'SQL'] },
  { id: 'j5', title: 'DevOps Engineer', department: 'Engineering', location: 'Đà Nẵng (Hybrid)', type: 'Full-time', applicants: 12, views: 98, posted: '2 tuần trước', status: 'active', aiScore: 79, tags: ['Kubernetes', 'CI/CD', 'AWS'] },
  { id: 'j6', title: 'Marketing Manager', department: 'Marketing', location: 'Hà Nội (Office)', type: 'Full-time', applicants: 0, views: 0, posted: 'Bản nháp', status: 'draft', aiScore: 0, tags: ['SEO', 'Content', 'Growth'] },
  { id: 'j7', title: 'iOS Engineer', department: 'Engineering', location: 'Hà Nội (Office)', type: 'Full-time', applicants: 34, views: 210, posted: '3 tuần trước', status: 'closed', aiScore: 90, tags: ['Swift', 'UIKit', 'SwiftUI'] },
];

const deptColors: Record<string, { bg: string; text: string }> = {
  Engineering: { bg: '#EBF3FD', text: '#0071E3' },
  Product: { bg: '#F5F3FF', text: '#6366F1' },
  Design: { bg: '#F0F9FF', text: '#0EA5E9' },
  Data: { bg: '#F0FDF4', text: '#16A34A' },
  Marketing: { bg: '#FDF4FF', text: '#9333EA' },
};

const statusConfig = {
  active: { label: 'Đang tuyển', bg: '#F0FDF4', text: '#16A34A', Icon: CheckCircle },
  draft: { label: 'Bản nháp', bg: '#F5F5F7', text: '#6E6E73', Icon: Edit3 },
  closed: { label: 'Đã đóng', bg: '#FEF2F2', text: '#DC2626', Icon: XCircle },
};

export default function JobPostingsPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'closed'>('all');
  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter);

  return (
    <div className="p-4 lg:p-6" style={{ fontFamily: SFT }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[13px] text-[#AEAEB2]">HR Portal</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#AEAEB2]" />
        <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>Tin tuyển dụng</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] text-[#1D1D1F] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>Tin tuyển dụng</h1>
          <p className="text-[13px] text-[#6E6E73] mt-0.5">
            {jobs.filter(j => j.status === 'active').length} vị trí đang tuyển · {jobs.filter(j => j.status === 'draft').length} bản nháp
          </p>
        </div>
        <Link href="/jobs/new"
          className="flex items-center gap-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl px-4 py-2.5 text-[13px] transition-all shadow-sm shadow-[#0071E3]/20"
          style={{ fontFamily: SFT, fontWeight: 500 }}>
          <Plus className="w-3.5 h-3.5" />Tạo tin mới
        </Link>
      </div>

      {/* AI insight banner */}
      <div className="bg-gradient-to-r from-[#EBF3FD] to-[#F5F3FF] rounded-2xl p-4 border border-[#D6E9FA] mb-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#0071E3] flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
            Gợi ý AI: Tin "Senior Frontend Engineer" đang thu hút nhiều ứng viên chất lượng
          </p>
          <p className="text-[12px] text-[#6E6E73] mt-0.5">
            AI phát hiện 5 ứng viên phù hợp 90%+ đã nộp đơn trong 24h qua. Xem xét tiến hành sàng lọc sớm.
          </p>
        </div>
        <button className="flex items-center gap-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl px-3.5 py-2 text-[12px] flex-shrink-0 transition-all" style={{ fontWeight: 500 }}>
          Xem ngay <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-5">
        {(['all', 'active', 'draft', 'closed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-xl text-[13px] transition-all ${filter === f ? 'bg-[#1D1D1F] text-white' : 'bg-white border border-[#E5E5EA] text-[#6E6E73] hover:border-[#D2D2D7]'}`}
            style={{ fontWeight: filter === f ? 500 : 400 }}>
            {f === 'all' ? 'Tất cả' : f === 'active' ? 'Đang tuyển' : f === 'draft' ? 'Bản nháp' : 'Đã đóng'}
          </button>
        ))}
      </div>

      {/* Job cards */}
      <div className="flex flex-col gap-3">
        {filtered.map((job, i) => {
          const dept = deptColors[job.department] || { bg: '#F5F5F7', text: '#6E6E73' };
          const status = statusConfig[job.status];
          return (
            <motion.div key={job.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-[#F2F2F7] hover:border-[#E5E5EA] hover:shadow-md hover:shadow-black/5 transition-all group cursor-pointer p-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: dept.bg }}>
                  <Briefcase className="w-5 h-5" style={{ color: dept.text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-[15px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>{job.title}</h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[12px] rounded-full px-2.5 py-0.5" style={{ background: dept.bg, color: dept.text, fontWeight: 500 }}>{job.department}</span>
                        <div className="flex items-center gap-1 text-[#AEAEB2]">
                          <MapPin className="w-3 h-3" />
                          <span className="text-[12px]">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#AEAEB2]">
                          <Clock className="w-3 h-3" />
                          <span className="text-[12px]">{job.posted}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1.5 text-[11px] rounded-full px-2.5 py-1" style={{ background: status.bg, color: status.text, fontWeight: 500 }}>
                        <status.Icon className="w-3 h-3" />
                        {status.label}
                      </div>
                      {job.status === 'active' && (
                        <div className="flex items-center gap-1 text-[11px] bg-[#EBF3FD] text-[#0071E3] rounded-full px-2.5 py-1">
                          <Zap className="w-2.5 h-2.5" />
                          <span style={{ fontWeight: 600 }}>AI {job.aiScore}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {job.tags.map(t => <span key={t} className="text-[11px] bg-[#F5F5F7] text-[#6E6E73] rounded-lg px-2 py-0.5 border border-[#F2F2F7]">{t}</span>)}
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#0071E3]" />
                      <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{job.applicants}</span>
                      <span className="text-[12px] text-[#AEAEB2]">ứng viên</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#AEAEB2]" />
                      <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{job.views}</span>
                      <span className="text-[12px] text-[#AEAEB2]">lượt xem</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button className="p-2 rounded-xl text-[#6E6E73] hover:bg-[#F5F5F7] transition-colors"><Edit3 className="w-4 h-4" /></button>
                  <button className="p-2 rounded-xl text-[#AEAEB2] hover:bg-[#FEF2F2] hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
