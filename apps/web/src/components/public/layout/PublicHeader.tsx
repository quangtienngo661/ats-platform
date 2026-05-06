'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Sparkles, Search, Briefcase, User, LogOut, ChevronDown, Menu, X, FileText } from 'lucide-react';
import { logoutAction } from '@/servers/auth/auth.action';
import { SF, SFT } from '@/types/fonts/fonts';
import { useSocketStore } from '@/stores/useSocketStore';

interface PublicHeaderProps {
    userInfo: { fullName?: string; role?: string } | null;
}

export function PublicHeader({ userInfo }: PublicHeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const socket = useSocketStore();
    const [avatarOpen, setAvatarOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const navLinks = [
        { href: '/', label: 'Trang chủ' },
        { href: '/job-postings', label: 'Tìm việc làm' },
        ...(userInfo ? [{ href: '/my-applications', label: 'Đơn ứng tuyển' }] : []),
    ];

    const handleLogout = async () => {
        setAvatarOpen(false);
        socket.disconnect();
        await logoutAction();
        router.push('/sign-in');
    };

    const initials = userInfo?.fullName
        ? userInfo.fullName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
        : '';

    const formatRole = (role: string) => {
        switch (role) {
            case 'candidate':
                return 'Ứng viên';
            case 'employer':
                return 'Nhà tuyển dụng';
            case 'admin':
                return 'Quản trị viên';
            default:
                return 'Khác';
        }
    };

    return (
        <header
            className="fixed top-0 left-0 right-0 h-[60px] bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA] z-50 flex items-center"
            style={{ fontFamily: SFT }}
        >
            <div className="max-w-[1200px] mx-auto px-6 w-full flex items-center gap-6">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-7 h-7 rounded-[8px] bg-[#0071E3] flex items-center justify-center shadow-sm">
                        <Sparkles className="w-[14px] h-[14px] text-white" />
                    </div>
                    <span className="text-[#1D1D1F] text-[15px] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>
                        TalentAI
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1 flex-1">
                    {navLinks.map(({ href, label }) => {
                        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`px-3 py-1.5 rounded-lg text-[13px] transition-all ${isActive
                                    ? 'bg-[#EBF3FD] text-[#0071E3]'
                                    : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
                                    }`}
                                style={{ fontWeight: isActive ? 500 : 400 }}
                            >
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex-1 hidden md:block" />


                {/* Right side */}
                {userInfo ? (
                    <div className="relative hidden md:block">
                        <button
                            onClick={() => setAvatarOpen(!avatarOpen)}
                            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F5F5F7] transition-colors"
                        >
                            <div className="w-7 h-7 rounded-full bg-[#0071E3] flex items-center justify-center text-white text-[11px]" style={{ fontWeight: 600 }}>
                                {initials}
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-[#AEAEB2] transition-transform ${avatarOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {avatarOpen && (
                            <div className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-2xl shadow-xl shadow-black/10 border border-[#E5E5EA] pt-1.5">
                                <div className="px-4 py-2 border-b border-[#F2F2F7]">
                                    <p className="text-[13px] text-[#1D1D1F] truncate mb-[3px]" style={{ fontWeight: 500 }}>{userInfo.fullName}</p>
                                    <p className="text-[11px] text-[#AEAEB2]">{formatRole(userInfo.role ?? '')}</p>
                                </div>
                                <Link
                                    href="/profile"
                                    onClick={() => setAvatarOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                                >
                                    <User className="w-4 h-4 text-[#AEAEB2]" />
                                    Hồ sơ của tôi
                                </Link>
                                <Link
                                    href="/my-applications"
                                    onClick={() => setAvatarOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                                >
                                    <Briefcase className="w-4 h-4 text-[#AEAEB2]" />
                                    Đơn ứng tuyển
                                </Link>
                                <Link
                                    href="/my-cvs"
                                    onClick={() => setAvatarOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                                >
                                    <FileText className="w-4 h-4 text-[#AEAEB2]" />
                                    CV của tôi
                                </Link>
                                <div className="border-t border-[#F2F2F7]">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2.5 px-4 py-[10px] text-[13px] text-[#FF3B30] hover:bg-[#FFF1F0] transition-colors rounded-b-2xl"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Đăng xuất
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="hidden md:flex items-center gap-2">
                        <Link
                            href="/sign-in"
                            className="px-4 py-2 text-[13px] text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-xl transition-colors"
                            style={{ fontWeight: 500 }}
                        >
                            Đăng nhập
                        </Link>
                        <Link
                            href="/register"
                            className="px-4 py-2 text-[13px] text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-xl transition-all shadow-sm shadow-[#0071E3]/20"
                            style={{ fontWeight: 500 }}
                        >
                            Đăng ký
                        </Link>
                    </div>
                )}

                {/* Mobile menu toggle */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden p-1.5 rounded-lg text-[#6E6E73] hover:bg-[#F5F5F7] transition-colors"
                >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Nav */}
            {mobileOpen && (
                <div className="md:hidden absolute top-[60px] left-0 right-0 bg-white border-b border-[#E5E5EA] shadow-lg">
                    <nav className="px-4 py-3 flex flex-col gap-1">
                        {navLinks.map(({ href, label }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setMobileOpen(false)}
                                className="px-3 py-2.5 rounded-xl text-[14px] text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#1D1D1F] transition-colors"
                            >
                                {label}
                            </Link>
                        ))}
                        <div className="border-t border-[#F2F2F7] mt-2 pt-2 flex flex-col gap-1">
                            {userInfo ? (
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-3 py-2.5 text-[14px] text-[#FF3B30] hover:bg-[#FFF1F0] rounded-xl transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Đăng xuất
                                </button>
                            ) : (
                                <>
                                    <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-[14px] text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-xl">Đăng nhập</Link>
                                    <Link href="/sign-up" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-[14px] text-white bg-[#0071E3] rounded-xl text-center">Đăng ký</Link>
                                </>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
