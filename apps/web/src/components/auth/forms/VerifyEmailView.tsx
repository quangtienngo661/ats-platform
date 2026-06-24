'use client';

import { useState, useActionState } from 'react';
import { motion } from 'motion/react';
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import Link from 'next/link';
import { requestEmailVerificationAction } from '@/servers/auth/auth.action';

const initialState = { success: false, message: '' };

interface VerifyEmailViewProps {
    email?: string | null;
}

export default function VerifyEmailView({ email }: VerifyEmailViewProps) {
    const [state, formAction] = useActionState(requestEmailVerificationAction, initialState);
    const [lastEmail] = useState(email ?? '');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-[24px] shadow-xl shadow-black/8 border border-[#E5E5EA] overflow-hidden"
        >
            <div className="p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-[#EBF3FD] flex items-center justify-center">
                        <Mail className="w-8 h-8 text-[#0071E3]" />
                    </div>
                </div>

                <h1 className="text-[22px] text-center text-[#1D1D1F] mb-2 tracking-[-0.02em]" style={{ fontFamily: SF, fontWeight: 700 }}>
                    Xác thực email của bạn
                </h1>
                <p className="text-[14px] text-center text-[#6E6E73] leading-relaxed mb-6" style={{ fontFamily: SFT }}>
                    Chúng tôi đã gửi email xác thực đến
                    {lastEmail ? (
                        <> <strong className="text-[#0071E3]">{lastEmail}</strong></>
                    ) : (
                        ' địa chỉ email của bạn'
                    )}
                </p>

                {/* Steps */}
                <div className="bg-[#F5F5F7] rounded-2xl p-5 mb-6">
                    <div className="space-y-3">
                        {[
                            'Kiểm tra hộp thư đến của bạn',
                            'Nhấp vào liên kết xác thực trong email',
                            'Hoàn tất và bắt đầu sử dụng TalentAI',
                        ].map((step, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div
                                    className="w-5 h-5 rounded-full bg-[#0071E3] text-white flex items-center justify-center text-[11px] mt-0.5 flex-shrink-0"
                                    style={{ fontWeight: 600 }}
                                >
                                    {i + 1}
                                </div>
                                <p className="text-[13px] text-[#1D1D1F] leading-relaxed" style={{ fontFamily: SFT }}>
                                    {step}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Resend */}
                <div className="text-center">
                    <p className="text-[13px] text-[#6E6E73] mb-3" style={{ fontFamily: SFT }}>
                        Không nhận được email?
                    </p>

                    <form action={formAction}>
                        <input type="hidden" name="email" value={lastEmail} />
                        <input type="hidden" name="type" value="verify" />
                        <button
                            type="submit"
                            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all text-[13px] ${state.success
                                ? 'bg-[#E8F5E9] text-[#34C759]'
                                : 'bg-[#F5F5F7] hover:bg-[#EBEBF0] text-[#0071E3]'
                                }`}
                            style={{ fontFamily: SFT, fontWeight: 500 }}
                        >
                            {state.success ? (
                                <><CheckCircle className="w-4 h-4" /> Đã gửi lại</>
                            ) : (
                                <><RefreshCw className="w-4 h-4" /> Gửi lại email</>
                            )}
                        </button>
                    </form>

                    {state.message && !state.success && (
                        <p className="text-[12px] text-[#FF3B30] mt-2" style={{ fontFamily: SFT }}>
                            {state.message}
                        </p>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-[#F5F5F7] px-8 py-5 border-t border-[#E5E5EA]">
                <p className="text-[12px] text-center text-[#6E6E73] leading-relaxed" style={{ fontFamily: SFT }}>
                    Email chưa đến sau vài phút? Kiểm tra thư mục spam hoặc{' '}
                    <Link href="/forgot-password" className="text-[#0071E3] hover:underline" style={{ fontWeight: 500 }}>
                        liên hệ hỗ trợ
                    </Link>
                </p>
                <div className="flex justify-center mt-3">
                    <Link
                        href="/sign-in"
                        className="flex items-center gap-1.5 text-[13px] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Quay về đăng nhập
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
