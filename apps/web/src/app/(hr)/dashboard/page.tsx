'use client'

import Link from 'next/link';
import { motion } from 'motion/react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, Users, Briefcase, CalendarCheck, ArrowRight,
  Clock, Star, ChevronRight, UserCheck,
} from 'lucide-react';

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif";
const SFT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif";

const applicationsTrend = [
  { month: 'T10', value: 95 },
  { month: 'T11', value: 140 },
  { month: 'T12', value: 118 },
  { month: 'T1', value: 165 },
  { month: 'T2', value: 210 },
  { month: 'T3', value: 247 },
];

const pipelineData = [
  { stage: 'Ứng tuyển', count: 247, color: '#94A3B8' },
  { stage: 'Sàng lọc', count: 148, color: '#3B82F6' },
  { stage: 'Phỏng vấn', count: 84, color: '#6366F1' },
  { stage: 'Kỹ thuật', count: 42, color: '#0EA5E9' },
  { stage: 'Offer', count: 19, color: '#34C759' },
  { stage: 'Đã tuyển', count: 12, color: '#0071E3' },
];

const sourceData = [
  { name: 'LinkedIn', value: 38, color: '#0071E3' },
  { name: 'Referral', value: 24, color: '#6366F1' },
  { name: 'Website', value: 18, color: '#0EA5E9' },
  { name: 'Indeed', value: 12, color: '#94A3B8' },
  { name: 'Khác', value: 8, color: '#CBD5E1' },
];

const recentCandidates = [
  { id: 1, name: 'Nguyễn Minh Tuấn', role: 'Senior Frontend Engineer', stage: 'Phỏng vấn', score: 92, days: 2, color: '#0071E3', initials: 'NT' },
  { id: 2, name: 'Trần Thị Lan', role: 'Product Manager', stage: 'Kỹ thuật', score: 88, days: 4, color: '#6366F1', initials: 'TL' },
  { id: 3, name: 'Lê Văn Hùng', role: 'Backend Engineer', stage: 'Offer', score: 95, days: 1, color: '#34C759', initials: 'LH' },
  { id: 4, name: 'Phạm Thu Hà', role: 'UX/UI Designer', stage: 'Sàng lọc', score: 79, days: 6, color: '#0EA5E9', initials: 'PH' },
  { id: 5, name: 'Đỗ Quốc Bảo', role: 'Data Scientist', stage: 'Ứng tuyển', score: 84, days: 1, color: '#8B5CF6', initials: 'DB' },
];

const upcomingInterviews = [
  { time: '09:00', name: 'Nguyễn Minh Tuấn', role: 'Frontend Engineer', type: 'Kỹ thuật', avatar: '#0071E3' },
  { time: '11:30', name: 'Trần Thị Lan', role: 'Product Manager', type: 'Ban quản lý', avatar: '#6366F1' },
  { time: '14:00', name: 'Vũ Thanh Tùng', role: 'DevOps Engineer', type: 'HR Screening', avatar: '#0EA5E9' },
  { time: '16:00', name: 'Hoàng Minh Nguyệt', role: 'Data Analyst', type: 'Kỹ thuật', avatar: '#8B5CF6' },
];

const stageColors: Record<string, string> = {
  'Ứng tuyển': '#94A3B8', 'Sàng lọc': '#3B82F6', 'Phỏng vấn': '#6366F1',
  'Kỹ thuật': '#0EA5E9', 'Offer': '#34C759', 'Đã tuyển': '#0071E3',
};
const stageBg: Record<string, string> = {
  'Ứng tuyển': '#F8FAFC', 'Sàng lọc': '#EFF6FF', 'Phỏng vấn': '#F5F3FF',
  'Kỹ thuật': '#F0F9FF', 'Offer': '#F0FDF4', 'Đã tuyển': '#EBF3FD',
};

const kpis = [
  { label: 'Tổng ứng viên', value: '1,247', change: '+12%', up: true, icon: Users, color: '#0071E3', bg: '#EBF3FD' },
  { label: 'Vị trí mở', value: '18', change: '0', up: null, icon: Briefcase, color: '#6366F1', bg: '#F5F3FF' },
  { label: 'Phỏng vấn/tuần', value: '24', change: '+8%', up: true, icon: CalendarCheck, color: '#0EA5E9', bg: '#F0F9FF' },
  { label: 'Đã tuyển (T3)', value: '12', change: '+5%', up: true, icon: UserCheck, color: '#34C759', bg: '#F0FDF4' },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E5E5EA] rounded-xl px-3 py-2 shadow-lg shadow-black/10">
      <p className="text-[11px] text-[#6E6E73] mb-0.5" style={{ fontFamily: SFT }}>{label}</p>
      <p className="text-[13px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
        {payload[0].value} ứng viên
      </p>
    </div>
  );
}

export default function HRDashboard() {
  return (
    <div className="p-4 lg:p-6" style={{ fontFamily: SFT }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[13px] text-[#AEAEB2]">HR Portal</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#AEAEB2]" />
        <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>Bảng điều khiển</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] text-[#1D1D1F] tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>
            Bảng điều khiển
          </h1>
          <p className="text-[13px] text-[#6E6E73] mt-0.5">Tổng quan tuyển dụng — Tháng 3, 2026</p>
        </div>
        <Link href="/kanban"
          className="hidden sm:flex items-center gap-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl px-4 py-2.5 text-[13px] transition-all shadow-sm shadow-[#0071E3]/20"
          style={{ fontFamily: SFT, fontWeight: 500 }}>
          Xem Kanban <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {kpis.map(({ label, value, change, up, icon: Icon, color, bg }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-white rounded-2xl p-4 border border-[#F2F2F7] hover:shadow-md hover:shadow-black/5 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              {up !== null && (
                <div className="flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5"
                  style={{ background: up ? '#F0FDF4' : '#FEF2F2', color: up ? '#16A34A' : '#DC2626', fontFamily: SFT, fontWeight: 600 }}>
                  <TrendingUp className={`w-2.5 h-2.5 ${!up ? 'rotate-180' : ''}`} />
                  {change}
                </div>
              )}
            </div>
            <p className="text-[26px] text-[#1D1D1F] tracking-[-0.03em] mb-0.5" style={{ fontFamily: SF, fontWeight: 700 }}>{value}</p>
            <p className="text-[12px] text-[#6E6E73]">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        {/* Area chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="xl:col-span-2 bg-white rounded-2xl p-5 border border-[#F2F2F7]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>
                Ứng tuyển theo thời gian
              </h3>
              <p className="text-[12px] text-[#6E6E73] mt-0.5">6 tháng gần nhất</p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#34C759] bg-[#F0FDF4] rounded-full px-2.5 py-1">
              <TrendingUp className="w-3 h-3" />
              <span style={{ fontFamily: SFT, fontWeight: 600 }}>+160% YoY</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={applicationsTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0071E3" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0071E3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F2F2F7" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#AEAEB2', fontSize: 11, fontFamily: SFT }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#AEAEB2', fontSize: 11, fontFamily: SFT }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Area type="monotone" dataKey="value" stroke="#0071E3" strokeWidth={2} fill="url(#blueGrad)" dot={{ fill: '#0071E3', r: 4, strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}
          className="bg-white rounded-2xl p-5 border border-[#F2F2F7]">
          <h3 className="text-[14px] text-[#1D1D1F] tracking-[-0.01em] mb-1" style={{ fontFamily: SF, fontWeight: 600 }}>Nguồn ứng viên</h3>
          <p className="text-[12px] text-[#6E6E73] mb-3">Tháng này</p>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={2} dataKey="value">
                  {sourceData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ borderRadius: '12px', border: '1px solid #E5E5EA', fontFamily: SFT, fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            {sourceData.map(({ name, value, color }) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-[12px] text-[#6E6E73]">{name}</span>
                </div>
                <span className="text-[12px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Pipeline + Recent candidates */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
          className="xl:col-span-1 bg-white rounded-2xl p-5 border border-[#F2F2F7]">
          <h3 className="text-[14px] text-[#1D1D1F] tracking-[-0.01em] mb-1" style={{ fontFamily: SF, fontWeight: 600 }}>Phễu tuyển dụng</h3>
          <p className="text-[12px] text-[#6E6E73] mb-4">Tổng ứng viên theo giai đoạn</p>
          <div className="flex flex-col gap-3">
            {pipelineData.map(({ stage, count, color }) => (
              <div key={stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-[#6E6E73]">{stage}</span>
                  <span className="text-[12px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{count}</span>
                </div>
                <div className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / 247) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Link href="/kanban"
            className="flex items-center justify-center gap-2 w-full mt-5 py-2.5 border border-[#E5E5EA] hover:border-[#D2D2D7] hover:bg-[#F5F5F7] text-[#1D1D1F] rounded-xl text-[13px] transition-all"
            style={{ fontFamily: SFT, fontWeight: 500 }}>
            Xem Kanban board <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        {/* Recent candidates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }}
          className="xl:col-span-2 bg-white rounded-2xl border border-[#F2F2F7] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
            <h3 className="text-[14px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>Ứng viên gần đây</h3>
            <Link href="/candidates" className="text-[12px] text-[#0071E3] hover:underline" style={{ fontWeight: 500 }}>Xem tất cả →</Link>
          </div>
          <div className="divide-y divide-[#F2F2F7]">
            {recentCandidates.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F5F5F7] transition-colors group cursor-pointer">
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white text-[12px] flex-shrink-0" style={{ background: c.color, fontFamily: SF, fontWeight: 600 }}>
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[#1D1D1F] truncate tracking-[-0.01em]" style={{ fontWeight: 500 }}>{c.name}</p>
                  <p className="text-[11px] text-[#AEAEB2] truncate">{c.role}</p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#AEAEB2]" />
                  <span className="text-[11px] text-[#AEAEB2]">{c.days}d</span>
                </div>
                <div className="hidden md:flex items-center gap-1">
                  <Star className="w-3 h-3 fill-[#0071E3] text-[#0071E3]" />
                  <span className="text-[12px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{c.score}</span>
                </div>
                <span className="text-[11px] rounded-full px-2.5 py-1 flex-shrink-0"
                  style={{ background: stageBg[c.stage] || '#F5F5F7', color: stageColors[c.stage] || '#6E6E73', fontWeight: 500 }}>
                  {c.stage}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#AEAEB2] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Today's interviews */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-4 bg-white rounded-2xl border border-[#F2F2F7] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
          <h3 className="text-[14px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>Phỏng vấn hôm nay</h3>
          <Link href="/interviews" className="text-[12px] text-[#0071E3] hover:underline" style={{ fontWeight: 500 }}>Xem lịch đầy đủ →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#F2F2F7]">
          {upcomingInterviews.map((iv) => (
            <div key={iv.time} className="flex items-center gap-3 px-5 py-4 hover:bg-[#F5F5F7] transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[12px] flex-shrink-0" style={{ background: iv.avatar, fontFamily: SF, fontWeight: 600 }}>
                {iv.name.split(' ').slice(-1)[0][0]}{iv.name.split(' ')[0][0]}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#0071E3] bg-[#EBF3FD] rounded-md px-1.5 py-0.5 flex-shrink-0" style={{ fontWeight: 600 }}>{iv.time}</span>
                </div>
                <p className="text-[13px] text-[#1D1D1F] truncate mt-1" style={{ fontWeight: 500 }}>{iv.name}</p>
                <p className="text-[11px] text-[#AEAEB2] truncate">{iv.type}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
