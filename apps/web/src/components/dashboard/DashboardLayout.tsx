'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Users, Briefcase, CalendarCheck,
  Settings, LogOut, Sparkles, Bell, Search,
  Menu, X, Plus, UserCircle, ChevronRight, Cpu,
  Building2, Zap, FolderTree, Activity, Users2,
} from 'lucide-react';
import { logoutAction } from '@/servers/auth/auth.action';
import { SF, SFT } from '@/types/fonts/fonts';

const navItems = [
  { icon: LayoutDashboard, label: 'Bảng điều khiển', href: '/dashboard' },
  { icon: Briefcase, label: 'Tin tuyển dụng', href: '/jobs', badge: 3 },
  { icon: CalendarCheck, label: 'Lịch phỏng vấn', href: '/interviews' },
];

const adminItems = [
  { icon: UserCircle, label: 'Quản lý người dùng', href: '/user-management' },
  { icon: Building2, label: 'Phòng ban', href: '/department-management' },
  { icon: Users2, label: 'Nhà tuyển dụng', href: '/recruiter-management' },
  { icon: FolderTree, label: 'Danh mục ngành nghề', href: '/job-category-management' },
  { icon: Zap, label: 'Kỹ năng', href: '/skill-management' },
  { icon: Cpu, label: 'Cấu hình AI', href: '/ai-configuration' },
  { icon: Activity, label: 'AI Usage Logs', href: '/ai-usage-logs' },
];

const bottomItems = [
  { icon: Settings, label: 'Hồ sơ của tôi', href: '/my-profile' },
  { icon: LogOut, label: 'Đăng xuất', href: '/sign-in/admin' },
];

const notifs = [
  { text: 'Nguyễn Minh đã hoàn thành bài test kỹ thuật', time: '5 phút trước', color: '#0071E3' },
  { text: 'Phỏng vấn với Trần Thị Lan lúc 14:00', time: '1 giờ trước', color: '#6366F1' },
  { text: 'Lê Văn Hùng chuyển sang giai đoạn Offer', time: '3 giờ trước', color: '#34C759' },
];

// ── SidebarContent ───────────────────────────────────────────────────────────
function SidebarContent({ onClose, userRole, userName, userEmail }: { onClose?: () => void, userRole?: string, userName?: string, userEmail?: string }) {
  const pathname = usePathname();
  const initials = userName ? userName.trim().split(' ').filter(Boolean).slice(-2).map(w => w[0].toUpperCase()).join('') : 'HR';

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center justify-between h-[64px] px-5 border-b border-[#F2F2F7] flex-shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-[9px] bg-[#0071E3] flex items-center justify-center shadow-sm">
            <Sparkles className="w-[15px] h-[15px] text-white" />
          </div>
          <span className="text-[#1D1D1F] text-[15px] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>
            TalentAI
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 text-[#6E6E73]">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Workspace selector */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <button className="w-full flex items-center justify-between bg-[#F5F5F7] hover:bg-[#EBEBF0] transition-colors rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#0071E3] flex items-center justify-center text-white text-[10px]" style={{ fontFamily: SF, fontWeight: 700 }}>
              A
            </div>
            <div className="text-left">
              <p className="text-[12px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontWeight: 500 }}>Acme Corp</p>
              <p className="text-[10px] text-[#6E6E73]">HR Manager</p>
            </div>
          </div>
          <ChevronRight className="w-3 h-3 text-[#AEAEB2]" />
        </button>
      </div>

      {/* Section label: Tuyển dụng */}
      <div className="px-5 pt-3 pb-1 flex-shrink-0">
        <span className="text-[10px] uppercase tracking-[0.07em] text-[#AEAEB2]" style={{ fontWeight: 600 }}>
          Tuyển dụng
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-3 overflow-y-auto" style={{ fontFamily: SFT }}>
        <ul className="space-y-0.5">
          {navItems.map(({ icon: Icon, label, href, badge }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <li key={label}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${isActive ? 'bg-[#EBF3FD] text-[#0071E3]' : 'text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
                    }`}
                >
                  <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-[#0071E3]' : 'text-[#AEAEB2]'}`} />
                  <span className="flex-1 text-[13px] tracking-[-0.01em]" style={{ fontWeight: isActive ? 500 : 400 }}>
                    {label}
                  </span>
                  {badge !== undefined && (
                    <span
                      className={`text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center ${isActive ? 'bg-[#0071E3] text-white' : 'bg-[#F2F2F7] text-[#6E6E73]'
                        }`}
                      style={{ fontWeight: 600 }}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {userRole === 'admin' && (
          <>
            <div className="my-3 border-t border-[#F2F2F7]" />

            {/* Section label: Quản trị */}
            <div className="px-2 mb-2">
              <span className="text-[10px] uppercase tracking-[0.07em] text-[#AEAEB2]" style={{ fontWeight: 600 }}>
                Quản trị
              </span>
            </div>

            <ul className="space-y-0.5">
              {adminItems.map(({ icon: Icon, label, href }) => {
                const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                return (
                  <li key={label}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${isActive ? 'bg-[#EBF3FD] text-[#0071E3]' : 'text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
                        }`}
                    >
                      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-[#0071E3]' : 'text-[#AEAEB2]'}`} />
                      <span className="flex-1 text-[13px] tracking-[-0.01em]" style={{ fontWeight: isActive ? 500 : 400 }}>
                        {label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <div className="my-3 border-t border-[#F2F2F7]" />

        {/* Section label: Hệ thống */}
        <div className="px-2 mb-2">
          <span className="text-[10px] uppercase tracking-[0.07em] text-[#AEAEB2]" style={{ fontWeight: 600 }}>
            Hệ thống
          </span>
        </div>

        <ul className="space-y-0.5">
          {bottomItems.map(({ icon: Icon, label, href }) => (
            <li key={label}>
              {label === 'Đăng xuất' ? (
                <button
                  onClick={async () => {
                    onClose?.();
                    await logoutAction(href);
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#AEAEB2] hover:bg-[#F5F5F7] hover:text-[#6E6E73] transition-all text-[13px]"
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span style={{ fontFamily: SFT }}>{label}</span>
                </button>
              ) : (
                <Link
                  href={href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#AEAEB2] hover:bg-[#F5F5F7] hover:text-[#6E6E73] transition-all text-[13px]"
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span style={{ fontFamily: SFT }}>{label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Profile */}
      <div className="flex-shrink-0 border-t border-[#F2F2F7] p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#0071E3] flex items-center justify-center text-white text-[11px]" style={{ fontFamily: SF, fontWeight: 600 }}>
              {initials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#34C759] rounded-full border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-[#1D1D1F] truncate tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 500 }}>
              {userName || 'HR Manager'}
            </p>
            <p className="text-[11px] text-[#AEAEB2] truncate" style={{ fontFamily: SFT }}>
              {userEmail || userRole || 'recruiter'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DashboardHeader ──────────────────────────────────────────────────────────
function DashboardHeader({ onMenuOpen, initials }: { onMenuOpen: () => void; initials: string }) {
  const [searchFocus, setSearchFocus] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="h-[64px] bg-white border-b border-[#F2F2F7] flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-20" style={{ fontFamily: SFT }}>
      <button onClick={onMenuOpen} className="lg:hidden p-1.5 rounded-lg text-[#6E6E73] hover:bg-[#F5F5F7] transition-colors">
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2 border transition-all duration-200 flex-1 max-w-[380px] ${searchFocus ? 'border-[#0071E3] bg-white shadow-sm shadow-[#0071E3]/10' : 'border-transparent bg-[#F5F5F7]'}`}>
        <Search className={`w-4 h-4 flex-shrink-0 ${searchFocus ? 'text-[#0071E3]' : 'text-[#AEAEB2]'}`} />
        <input
          type="text"
          placeholder="Tìm ứng viên, vị trí..."
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          className="bg-transparent text-[13px] text-[#1D1D1F] placeholder-[#AEAEB2] outline-none w-full"
          style={{ fontFamily: SFT }}
        />
      </div>

      <div className="flex-1" />

      {/* AI Interview shortcut */}
      <Link
        href="/phong-van-ai"
        className="hidden sm:flex items-center gap-2 bg-[#EBF3FD] hover:bg-[#D6E9FA] text-[#0071E3] rounded-xl px-3.5 py-2 transition-all text-[12px]"
        style={{ fontFamily: SFT, fontWeight: 500 }}
      >
        <Cpu className="w-3.5 h-3.5" />
        Phỏng vấn AI
      </Link>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 rounded-xl text-[#6E6E73] hover:bg-[#F5F5F7] transition-all"
        >
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#0071E3] rounded-full border-2 border-white" />
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-[300px] bg-white rounded-2xl shadow-xl shadow-black/10 border border-[#E5E5EA] z-50">
            <div className="px-4 py-3 border-b border-[#F2F2F7] flex items-center justify-between">
              <span className="text-[13px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>Thông báo</span>
              <span className="text-[11px] text-[#0071E3] cursor-pointer" style={{ fontWeight: 500 }}>Đánh dấu đã đọc</span>
            </div>
            {notifs.map((n, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-[#F5F5F7] cursor-pointer border-b border-[#F2F2F7] last:border-0 transition-colors">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.color }} />
                <div>
                  <p className="text-[12px] text-[#1D1D1F] leading-[1.45]" style={{ fontFamily: SFT }}>{n.text}</p>
                  <p className="text-[11px] text-[#AEAEB2] mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add */}
      <button className="flex items-center gap-1.5 bg-[#0071E3] hover:bg-[#0077ED] active:bg-[#006FD6] text-white rounded-xl px-3.5 py-2 transition-all shadow-sm shadow-[#0071E3]/20">
        <Plus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-[13px]" style={{ fontFamily: SFT, fontWeight: 500 }}>Thêm mới</span>
      </button>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#0071E3] flex items-center justify-center text-white text-[12px] cursor-pointer" style={{ fontFamily: SF, fontWeight: 600 }}>
        {initials}
      </div>
    </header>
  );
}

// ── DashboardLayout (Root export) ────────────────────────────────────────────
export function DashboardLayout({ children, userRole, userName, userEmail }: { children: React.ReactNode, userRole?: string, userName?: string, userEmail?: string }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const initials = userName ? userName.trim().split(' ').filter(Boolean).slice(-2).map(w => w[0].toUpperCase()).join('') : 'HR';

  return (
    <div className="flex h-screen bg-[#F5F5F7] overflow-hidden" style={{ fontFamily: SFT }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[220px] xl:w-[240px] h-screen bg-white border-r border-[#F2F2F7] fixed left-0 top-0 z-30 flex-shrink-0">
        <SidebarContent userRole={userRole} userName={userName} userEmail={userEmail} />
      </aside>

      {/* Mobile Sidebar — slide-in with Framer Motion */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ ease: [0.25, 0.46, 0.45, 0.94], duration: 0.3 }}
              className="relative w-[240px] h-full bg-white border-r border-[#F2F2F7] z-50 flex flex-col"
            >
              <SidebarContent onClose={() => setMobileSidebarOpen(false)} userRole={userRole} userName={userName} userEmail={userEmail} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[220px] xl:pl-[240px]">
        <DashboardHeader onMenuOpen={() => setMobileSidebarOpen(true)} initials={initials} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}