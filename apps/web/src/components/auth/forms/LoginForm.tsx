'use client';

import { useState, useActionState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import Link from 'next/link';
import { signInAction } from '@/servers/auth/auth.action';
import SubmitButton from '@/components/common/SubmitButton';
import { OAuthButtons } from '../ui/OAuthButtons';
import { useSearchParams } from 'next/navigation';

const initialState = { success: false, message: '' };

const INPUT_CLS = "w-full pl-10 pr-4 py-3 bg-[#F5F5F7] border border-transparent rounded-xl text-[14px] text-[#1D1D1F] placeholder-[#AEAEB2] outline-none transition-all focus:border-[#0071E3] focus:bg-white focus:shadow-sm focus:shadow-[#0071E3]/10";

export default function LoginForm() {
    const [showPw, setShowPw] = useState(false);
    const [state, formAction] = useActionState(signInAction, initialState);
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '';

    const oauthError = searchParams.get('error') === 'oauth_failed'
        ? 'Đăng nhập bằng OAuth thất bại. Vui lòng thử lại.'
        : null;
    const resetSuccess = searchParams.get('reset') === 'success';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-[24px] shadow-xl shadow-black/8 border border-[#E5E5EA] p-8"
        >
            <h1 className="text-[22px] text-[#1D1D1F] tracking-[-0.02em] mb-1" style={{ fontFamily: SF, fontWeight: 700 }}>
                Chào mừng trở lại
            </h1>
            <p className="text-[14px] text-[#6E6E73] mb-6" style={{ fontFamily: SFT }}>
                Đăng nhập vào tài khoản của bạn
            </p>

            {/* Reset success banner */}
            {resetSuccess && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-[#E8F5E9] text-[#34C759] text-[13px] text-center" style={{ fontFamily: SFT }}>
                    Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.
                </div>
            )}

            {/* OAuth buttons */}
            <OAuthButtons errorMessage={oauthError} />

            {/* Form */}
            <form action={formAction} className="flex flex-col gap-4">
                {/* Email */}
                <div>
                    <label className="block text-[13px] text-[#1D1D1F] mb-1.5 tracking-[-0.01em]" style={{ fontWeight: 500 }}>
                        Email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEAEB2]" />
                        <input
                            type="email"
                            name="email"
                            placeholder="your@email.com"
                            className={INPUT_CLS}
                            style={{ fontFamily: SFT }}
                            required
                        />
                    </div>
                </div>

                {/* Password */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[13px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontWeight: 500 }}>Mật khẩu</label>
                        <Link href="/forgot-password" className="text-[12px] text-[#0071E3] hover:underline">
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

                {/* 2. Ép nó vào form ẩn để gửi kèm lên Server Action */}
                <input type="hidden" name="callbackUrl" value={callbackUrl} />

                {/* Error */}
                {state.message && !state.success && (
                    <p className="text-[#FF3B30] text-[13px] text-center" style={{ fontFamily: SFT }}>
                        {state.message}
                    </p>
                )}

                <SubmitButton content="Đăng nhập" />
            </form>

            <p className="text-center text-[13px] text-[#6E6E73] mt-6" style={{ fontFamily: SFT }}>
                Chưa có tài khoản?{' '}
                <Link href="/register" className="text-[#0071E3] hover:underline" style={{ fontWeight: 500 }}>
                    Đăng ký ngay
                </Link>
            </p>
        </motion.div>
    );
}