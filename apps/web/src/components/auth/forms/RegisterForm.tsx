'use client';

import { useState, useActionState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import Link from 'next/link';
import { registerAction } from '@/servers/auth/auth.action';
import { OAuthButtons } from '../ui/OAuthButtons';

const initialState = { success: false, message: '' };

const INPUT_CLS = "w-full pl-10 pr-4 py-3 bg-[#F5F5F7] border border-transparent rounded-xl text-[14px] text-[#1D1D1F] placeholder-[#AEAEB2] outline-none transition-all focus:border-[#0071E3] focus:bg-white focus:shadow-sm focus:shadow-[#0071E3]/10";

// Password requirement checker
function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
    return (
        <li className={`text-[11px] flex items-center gap-1.5 transition-colors ${met ? 'text-[#34C759]' : 'text-[#AEAEB2]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${met ? 'bg-[#34C759]' : 'bg-[#D1D1D6]'}`} />
            {label}
        </li>
    );
}

export default function RegisterForm() {
    const [showPw, setShowPw] = useState(false);
    const [password, setPassword] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [state, formAction] = useActionState(registerAction, initialState);

    const reqs = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[^A-Za-z0-9]/.test(password),
    };
    const allMet = Object.values(reqs).every(Boolean);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-[24px] shadow-xl shadow-black/8 border border-[#E5E5EA] p-8"
        >
            <h1 className="text-[22px] text-[#1D1D1F] tracking-[-0.02em] mb-1" style={{ fontFamily: SF, fontWeight: 700 }}>
                Tạo tài khoản
            </h1>
            <p className="text-[14px] text-[#6E6E73] mb-6" style={{ fontFamily: SFT }}>
                Đăng ký để bắt đầu hành trình của bạn
            </p>

            {/* OAuth */}
            <OAuthButtons />

            {/* Form */}
            <form action={formAction} className="flex flex-col gap-4">
                {/* Full name */}
                <div>
                    <label className="block text-[13px] text-[#1D1D1F] mb-1.5" style={{ fontWeight: 500 }}>Họ và tên</label>
                    <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEAEB2]" />
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Nguyễn Văn A"
                            required
                            className={INPUT_CLS}
                            style={{ fontFamily: SFT }}
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-[13px] text-[#1D1D1F] mb-1.5" style={{ fontWeight: 500 }}>Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEAEB2]" />
                        <input
                            type="email"
                            name="email"
                            placeholder="your@email.com"
                            required
                            className={INPUT_CLS}
                            style={{ fontFamily: SFT }}
                        />
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label className="block text-[13px] text-[#1D1D1F] mb-1.5" style={{ fontWeight: 500 }}>Mật khẩu</label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEAEB2]" />
                        <input
                            type={showPw ? 'text' : 'password'}
                            name="password"
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`${INPUT_CLS} pr-10`}
                            style={{ fontFamily: SFT }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw(!showPw)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2] hover:text-[#6E6E73] transition-colors"
                        >
                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Password requirements */}
                    {password && (
                        <ul className="mt-2 space-y-1 pl-1">
                            <PasswordRequirement met={reqs.length} label="Ít nhất 8 ký tự" />
                            <PasswordRequirement met={reqs.upper} label="Ít nhất 1 chữ hoa" />
                            <PasswordRequirement met={reqs.number} label="Ít nhất 1 chữ số" />
                            <PasswordRequirement met={reqs.symbol} label="Ít nhất 1 ký tự đặc biệt (!@#...)" />
                        </ul>
                    )}
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer">
                    <div
                        onClick={() => setAgreed(!agreed)}
                        className={`w-5 h-5 rounded-[6px] border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer ${agreed ? 'bg-[#0071E3] border-[#0071E3]' : 'border-[#D2D2D7]'}`}
                    >
                        {agreed && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <span className="text-[13px] text-[#6E6E73] leading-[1.5]" style={{ fontFamily: SFT }}>
                        Tôi đồng ý với{' '}
                        <a href="#" className="text-[#0071E3] hover:underline">Điều khoản dịch vụ</a> và{' '}
                        <a href="#" className="text-[#0071E3] hover:underline">Chính sách bảo mật</a>
                    </span>
                </label>

                {/* Feedback */}
                {state.message && (
                    <p className={`text-[13px] text-center ${state.success ? 'text-[#34C759]' : 'text-[#FF3B30]'}`} style={{ fontFamily: SFT }}>
                        {state.message}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={!agreed || !allMet}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-[14px] transition-all shadow-sm shadow-[#0071E3]/20 disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                    style={{ fontFamily: SFT, fontWeight: 500 }}
                >
                    Tạo tài khoản <ArrowRight className="w-4 h-4" />
                </button>
            </form>

            <p className="text-center text-[13px] text-[#6E6E73] mt-6" style={{ fontFamily: SFT }}>
                Đã có tài khoản?{' '}
                <Link href="/sign-in" className="text-[#0071E3] hover:underline" style={{ fontWeight: 500 }}>
                    Đăng nhập
                </Link>
            </p>
        </motion.div>
    );
}
