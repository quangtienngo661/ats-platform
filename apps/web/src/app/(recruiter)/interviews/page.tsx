'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, Video, MapPin, Clock, Users, MoreHorizontal } from 'lucide-react';

const SF  = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif";
const SFT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif";

const days  = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
const dates = ['03/03', '04/03', '05/03', '06/03', '07/03'];
const hours = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

interface Interview {
  id: string; day: number; startHour: number; endHour: number;
  name: string; role: string; type: string; avatarColor: string;
  initials: string; interviewer: string; mode: 'online' | 'offline';
  stage: string; color: string; bg: string;
}

const interviews: Interview[] = [
  { id:'i1', day:0, startHour:9,  endHour:10, name:'Nguyễn Minh Tuấn',  role:'Frontend Engineer',  type:'Vòng kỹ thuật',  avatarColor:'#0071E3', initials:'NT', interviewer:'Alex Johnson',  mode:'online',  stage:'Kỹ thuật',  color:'#0071E3', bg:'#EBF3FD' },
  { id:'i2', day:0, startHour:14, endHour:15, name:'Trần Thị Lan',       role:'Product Manager',    type:'Panel interview', avatarColor:'#6366F1', initials:'TL', interviewer:'Sarah Lee',    mode:'offline', stage:'Phỏng vấn', color:'#6366F1', bg:'#F5F3FF' },
  { id:'i3', day:1, startHour:10, endHour:11, name:'Phạm Thu Hà',        role:'UX/UI Designer',     type:'Portfolio review',avatarColor:'#0EA5E9', initials:'PH', interviewer:'Mike Chen',    mode:'online',  stage:'Phỏng vấn', color:'#0EA5E9', bg:'#F0F9FF' },
  { id:'i4', day:2, startHour:9,  endHour:10, name:'Lê Văn Hùng',        role:'Backend Engineer',   type:'System design',   avatarColor:'#34C759', initials:'LH', interviewer:'Alex Johnson',  mode:'online',  stage:'Kỹ thuật',  color:'#34C759', bg:'#F0FDF4' },
  { id:'i5', day:2, startHour:15, endHour:16, name:'Đỗ Quốc Bảo',        role:'Data Scientist',     type:'Case study',      avatarColor:'#8B5CF6', initials:'DB', interviewer:'Linh Nguyen',   mode:'offline', stage:'Sàng lọc',  color:'#8B5CF6', bg:'#F5F3FF' },
  { id:'i6', day:3, startHour:11, endHour:12, name:'Vũ Thanh Tùng',      role:'Full Stack Eng',     type:'Vòng kỹ thuật',  avatarColor:'#F59E0B', initials:'VT', interviewer:'Tom Park',      mode:'online',  stage:'Kỹ thuật',  color:'#0071E3', bg:'#EBF3FD' },
  { id:'i7', day:4, startHour:10, endHour:11, name:'Hoàng Minh Nguyệt',  role:'DevOps Engineer',    type:'HR Screening',    avatarColor:'#EC4899', initials:'HN', interviewer:'Sarah Lee',    mode:'online',  stage:'Sàng lọc',  color:'#64748B', bg:'#F8FAFC' },
  { id:'i8', day:4, startHour:14, endHour:15, name:'Bùi Thị Mai',        role:'Marketing Manager',  type:'Panel interview', avatarColor:'#14B8A6', initials:'BM', interviewer:'Alex Johnson',  mode:'offline', stage:'Phỏng vấn', color:'#0EA5E9', bg:'#F0F9FF' },
];

const todaySummary = [
  { label: 'Tổng phỏng vấn', value: '8', color: '#0071E3', bg: '#EBF3FD' },
  { label: 'Trực tuyến',     value: '5', color: '#6366F1', bg: '#F5F3FF' },
  { label: 'Trực tiếp',      value: '3', color: '#34C759', bg: '#F0FDF4' },
  { label: 'Đang chờ',       value: '2', color: '#F59E0B', bg: '#FFFBEB' },
];

export default function InterviewSchedulePage() {
  const [selectedDay, setSelectedDay]           = useState(2);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  return (
    <div className="flex h-full flex-col" style={{ fontFamily: SFT }}>
      {/* Breadcrumb */}
      <div className="px-4 lg:px-6 pt-4 pb-2 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[#AEAEB2]">HR Portal</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#AEAEB2]" />
          <span className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>Lịch phỏng vấn</span>
        </div>
      </div>

      {/* Top bar */}
      <div className="px-4 lg:px-6 py-4 border-b border-[#F2F2F7] bg-white flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-[15px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>Lịch phỏng vấn</h1>
          <p className="text-[12px] text-[#AEAEB2]">Tuần 10 — 03/03 – 07/03, 2026</p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button className="p-2 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[#6E6E73] transition-all"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-[13px] text-[#1D1D1F] px-3" style={{ fontWeight: 500 }}>Tháng 3, 2026</span>
          <button className="p-2 rounded-xl border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[#6E6E73] transition-all"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <button className="flex items-center gap-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl px-3.5 py-2 text-[13px] transition-all shadow-sm">
          <Plus className="w-3.5 h-3.5" />Đặt phỏng vấn
        </button>
      </div>

      {/* Summary strip */}
      <div className="px-4 lg:px-6 py-3 bg-white border-b border-[#F2F2F7] grid grid-cols-4 gap-3">
        {todaySummary.map(({ label, value, color, bg }) => (
          <div key={label} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
              <span className="text-[14px]" style={{ fontFamily: SF, fontWeight: 700, color }}>{value}</span>
            </div>
            <p className="text-[12px] text-[#6E6E73] leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="min-w-[600px]">
            {/* Day headers */}
            <div className="sticky top-0 z-10 bg-white border-b border-[#F2F2F7] grid grid-cols-[60px_repeat(5,1fr)]">
              <div />
              {days.map((d, i) => (
                <button key={d} onClick={() => setSelectedDay(i)}
                  className={`py-3 text-center border-l border-[#F2F2F7] transition-all ${selectedDay === i ? 'bg-[#EBF3FD]' : 'hover:bg-[#F5F5F7]'}`}>
                  <p className="text-[11px]" style={{ fontWeight: 600, color: selectedDay === i ? '#0071E3' : '#AEAEB2' }}>{d}</p>
                  <div className={`mx-auto mt-1 w-7 h-7 rounded-full flex items-center justify-center text-[13px] transition-all ${i === 2 ? (selectedDay === i ? 'bg-[#0071E3] text-white' : 'bg-[#EBF3FD] text-[#0071E3]') : ''}`}
                    style={{ fontWeight: i === 2 ? 700 : 400, color: selectedDay === i ? (i === 2 ? '#fff' : '#0071E3') : '#6E6E73' }}>
                    {dates[i].split('/')[0]}
                  </div>
                </button>
              ))}
            </div>

            {/* Time slots */}
            {hours.map((h, hi) => (
              <div key={h} className="grid grid-cols-[60px_repeat(5,1fr)]" style={{ minHeight: '72px' }}>
                <div className="flex items-start justify-end pr-3 pt-1">
                  <span className="text-[10px] text-[#AEAEB2]">{h}</span>
                </div>
                {days.map((_, di) => {
                  const slotInterviews = interviews.filter(iv => iv.day === di && iv.startHour === (hi + 8));
                  return (
                    <div key={di} className={`relative border-l border-b border-[#F2F2F7] p-1 transition-colors hover:bg-[#F5F5F7]/50 ${selectedDay === di ? 'bg-[#EBF3FD]/20' : ''}`}>
                      {slotInterviews.map(iv => (
                        <motion.div key={iv.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedInterview(iv)}
                          className="rounded-xl p-2 cursor-pointer border mb-1"
                          style={{ background: iv.bg, borderColor: iv.color + '40' }}>
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] flex-shrink-0"
                              style={{ background: iv.avatarColor, fontFamily: SF, fontWeight: 700 }}>{iv.initials}</div>
                            <div className="min-w-0">
                              <p className="text-[11px] truncate" style={{ fontWeight: 500, color: iv.color }}>{iv.name}</p>
                              <p className="text-[10px] text-[#AEAEB2] truncate">{iv.type}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedInterview && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ ease: [0.25, 0.46, 0.45, 0.94], duration: 0.3 }}
              className="w-[280px] border-l border-[#F2F2F7] bg-white flex flex-col overflow-hidden flex-shrink-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#F2F2F7]">
                <span className="text-[13px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>Chi tiết phỏng vấn</span>
                <button onClick={() => setSelectedInterview(null)} className="p-1 rounded-lg text-[#AEAEB2] hover:bg-[#F5F5F7]">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-[14px]"
                    style={{ background: selectedInterview.avatarColor, fontFamily: SF, fontWeight: 700 }}>
                    {selectedInterview.initials}
                  </div>
                  <div>
                    <p className="text-[14px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>{selectedInterview.name}</p>
                    <p className="text-[12px] text-[#6E6E73]">{selectedInterview.role}</p>
                  </div>
                </div>

                {[
                  { icon: Clock, label: 'Thời gian', value: `${days[selectedInterview.day]}, ${dates[selectedInterview.day]} — ${hours[selectedInterview.startHour-8]} – ${hours[selectedInterview.endHour-8]}` },
                  { icon: Users, label: 'Người phỏng vấn', value: selectedInterview.interviewer },
                  { icon: selectedInterview.mode === 'online' ? Video : MapPin, label: 'Hình thức', value: selectedInterview.mode === 'online' ? 'Google Meet' : 'Văn phòng Hà Nội' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 mb-3 p-3 bg-[#F5F5F7] rounded-xl">
                    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Icon className="w-3.5 h-3.5 text-[#0071E3]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#AEAEB2] mb-0.5">{label}</p>
                      <p className="text-[12px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{value}</p>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between mb-4">
                  <span className="text-[12px] text-[#6E6E73]">Giai đoạn</span>
                  <span className="text-[11px] rounded-full px-2.5 py-1" style={{ background: selectedInterview.bg, color: selectedInterview.color, fontWeight: 500 }}>
                    {selectedInterview.stage}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-[#E5E5EA]">
                  <p className="text-[11px] text-[#AEAEB2] mb-0.5">Loại phỏng vấn</p>
                  <p className="text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{selectedInterview.type}</p>
                </div>
              </div>

              <div className="p-4 border-t border-[#F2F2F7] flex flex-col gap-2">
                <button className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-[13px] transition-all" style={{ fontWeight: 500 }}>
                  <Video className="w-3.5 h-3.5" />Tham gia ngay
                </button>
                <button className="flex items-center justify-center gap-2 w-full py-2.5 border border-[#E5E5EA] hover:bg-[#F5F5F7] text-[#6E6E73] rounded-xl text-[13px] transition-all">
                  Đổi lịch
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
