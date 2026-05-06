'use client';

import { useState, useActionState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Shield, Users } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import Link from 'next/link';
import { signInAction } from '@/servers/auth/auth.action';

import { useSearchParams } from 'next/navigation';
import { toast } from '@/lib/toast';

const initialState = { success: false, message: '' };

const INPUT_CLS =
    'w-full pl-10 pr-4 py-3 bg-white border border-[#E5E5EA] rounded-xl text-[14px] text-[#1D1D1F] placeholder-[#AEAEB2] outline-none transition-all focus:border-[#7C3AED] focus:shadow-sm focus:shadow-[#7C3AED]/10';

type StaffRole = 'admin' | 'recruiter';

const ROLES: { id: StaffRole; label: string; icon: React.ReactNode; color: string }[] = [
    {
        id: 'admin',
        label: 'Admin',
        icon: <Shield className="w-4 h-4" />,
        color: '#A78BFA',
    },
    {
        id: 'recruiter',
        label: 'Recruiter',
        icon: <Users className="w-4 h-4" />,
        color: '#34D399',
    },
];

export default function StaffLoginForm({ isRoleDifferent }: { isRoleDifferent?: boolean }) {
    const [showPw, setShowPw] = useState(false);
    const [role, setRole] = useState<StaffRole>('admin');
    const [state, formAction] = useActionState(signInAction, initialState);
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '';

    const activeRole = ROLES.find((r) => r.id === role)!;

    useEffect(() => {
        if (isRoleDifferent) {
            toast.info("Bạn được điều hướng khi cố gắng đăng nhập tài khoản quản trị")
        }
    }, [isRoleDifferent])

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="relative overflow-hidden rounded-[28px] border border-white/10 shadow-2xl"
            style={{
                background:
                    'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
            }}
        >
            {/* Glow accent top */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[2px] rounded-full transition-all duration-500"
                style={{
                    background: `linear-gradient(90deg, transparent, ${activeRole.color}, transparent)`,
                    boxShadow: `0 0 24px 4px ${activeRole.color}55`,
                }}
            />

            <div className="p-8">
                {/* Header */}
                <div className="mb-7">
                    <h1
                        className="text-[22px] text-white tracking-[-0.02em] mb-1"
                        style={{ fontFamily: SF, fontWeight: 700 }}
                    >
                        Cổng nội bộ
                    </h1>
                    <p className="text-[14px] text-white/50" style={{ fontFamily: SFT }}>
                        Dành riêng cho nhân sự TalentAI
                    </p>
                </div>

                {/* Role selector */}
                <div
                    className="flex gap-2 p-1 rounded-2xl mb-7"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                    {ROLES.map((r) => {
                        const isActive = role === r.id;
                        return (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => setRole(r.id)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] transition-all duration-300 relative"
                                style={{
                                    fontFamily: SFT,
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? r.color : 'rgba(255,255,255,0.45)',
                                    background: isActive
                                        ? `${r.color}18`
                                        : 'transparent',
                                    border: isActive ? `1.5px solid ${r.color}40` : '1.5px solid transparent',
                                }}
                            >
                                {r.icon}
                                <span>{r.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Form */}
                <form action={formAction} className="flex flex-col gap-4">
                    {/* Hidden role field */}
                    <input type="hidden" name="role" value={role} />
                    <input type="hidden" name="callbackUrl" value={callbackUrl} />

                    {/* Email */}
                    <div>
                        <label
                            className="block text-[13px] text-white/70 mb-1.5 tracking-[-0.01em]"
                            style={{ fontWeight: 500 }}
                        >
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEAEB2]" />
                            <input
                                type="email"
                                name="email"
                                placeholder="staff@talentai.vn"
                                className={INPUT_CLS}
                                style={{ fontFamily: SFT }}
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label
                                className="text-[13px] text-white/70 tracking-[-0.01em]"
                                style={{ fontWeight: 500 }}
                            >
                                Mật khẩu
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-[12px] transition-colors"
                                style={{ color: activeRole.color }}
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEAEB2]" />
                            <input
                                type={showPw ? 'text' : 'password'}
                                name="password"
                                placeholder="••••••••"
                                className={`${INPUT_CLS} pr-10`}
                                style={{ fontFamily: SFT }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(!showPw)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2] hover:text-[#6E6E73] transition-colors"
                            >
                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {state.message && !state.success && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-[13px] text-center px-3 py-2 rounded-xl"
                                style={{
                                    fontFamily: SFT,
                                    color: '#FF6B6B',
                                    background: 'rgba(255,59,48,0.12)',
                                }}
                            >
                                {state.message}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {/* Submit */}
                    <motion.div
                        key={role}
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <button
                            type="submit"
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[14px] transition-all shadow-lg mt-1 font-medium"
                            style={{
                                fontFamily: SFT,
                                fontWeight: 600,
                                color: '#fff',
                                background: `linear-gradient(135deg, ${activeRole.color}CC, ${activeRole.color}99)`,
                                boxShadow: `0 4px 18px ${activeRole.color}44`,
                                border: `1px solid ${activeRole.color}55`,
                            }}
                        >
                            {activeRole.icon}
                            <span>Đăng nhập với tư cách {activeRole.label}</span>
                        </button>
                    </motion.div>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                    <span className="text-[11px] text-white/30" style={{ fontFamily: SFT }}>
                        hoặc
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                </div>

                {/* Back link */}
                <p className="text-center text-[13px] text-white/40" style={{ fontFamily: SFT }}>
                    Không phải nhân viên?{' '}
                    <Link href="/sign-in" className="hover:underline transition-colors" style={{ color: activeRole.color, fontWeight: 500 }}>
                        Đăng nhập thông thường
                    </Link>
                </p>
            </div>
        </motion.div>
    );
}
