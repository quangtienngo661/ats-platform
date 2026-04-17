'use client';

import { useState, useActionState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import Link from 'next/link';
import { forgotPasswordAction } from '@/servers/auth/auth.action';

const initialState = { success: false, message: '' };

export default function ForgotPasswordForm() {
    const [emailValue, setEmailValue] = useState('');
    const [state, formAction] = useActionState(forgotPasswordAction, initialState);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-[24px] shadow-xl shadow-black/8 border border-[#E5E5EA] p-8"
        >
            {!state.success ? (
                <>
                    <div className="w-12 h-12 rounded-2xl bg-[#EBF3FD] flex items-center justify-center mb-5">
                        <Mail className="w-6 h-6 text-[#0071E3]" />
                    </div>

                    <h1 className="text-[22px] text-[#1D1D1F] tracking-[-0.02em] mb-1" style={{ fontFamily: SF, fontWeight: 700 }}>
                        Quên mật khẩu?
                    </h1>
                    <p className="text-[14px] text-[#6E6E73] mb-6" style={{ fontFamily: SFT }}>
                        Nhập email và chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
                    </p>

                    <form action={formAction} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-[13px] text-[#1D1D1F] mb-1.5" style={{ fontWeight: 500 }}>Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEAEB2]" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="your@email.com"
                                    required
                                    value={emailValue}
                                    onChange={(e) => setEmailValue(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-[#F5F5F7] border border-transparent rounded-xl text-[14px] text-[#1D1D1F] placeholder-[#AEAEB2] outline-none transition-all focus:border-[#0071E3] focus:bg-white focus:shadow-sm focus:shadow-[#0071E3]/10"
                                    style={{ fontFamily: SFT }}
                                />
                            </div>
                        </div>

                        {state.message && !state.success && (
                            <p className="text-[#FF3B30] text-[13px] text-center" style={{ fontFamily: SFT }}>
                                {state.message}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-[14px] transition-all shadow-sm shadow-[#0071E3]/20"
                            style={{ fontFamily: SFT, fontWeight: 500 }}
                        >
                            Gửi liên kết đặt lại
                        </button>
                    </form>
                </>
            ) : (
                /* Success state */
                <div className="text-center py-2">
                    <div className="w-14 h-14 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto mb-5">
                        <CheckCircle className="w-7 h-7 text-[#34C759]" />
                    </div>
                    <h1 className="text-[20px] text-[#1D1D1F] tracking-[-0.02em] mb-2" style={{ fontFamily: SF, fontWeight: 700 }}>
                        Email đã được gửi!
                    </h1>
                    <p className="text-[14px] text-[#6E6E73] mb-6 leading-relaxed" style={{ fontFamily: SFT }}>
                        Kiểm tra hộp thư <strong className="text-[#1D1D1F]">{emailValue}</strong> để tìm liên kết đặt lại mật khẩu. Link có hiệu lực trong 24 giờ.
                    </p>
                    <p className="text-[12px] text-[#AEAEB2] mb-4" style={{ fontFamily: SFT }}>
                        Không nhận được? Kiểm tra thư mục spam.
                    </p>
                </div>
            )}

            <div className="mt-6 pt-5 border-t border-[#F2F2F7]">
                <Link
                    href="/sign-in"
                    className="flex items-center justify-center gap-1.5 text-[13px] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
                    style={{ fontFamily: SFT }}
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Quay về đăng nhập
                </Link>
            </div>
        </motion.div>
    );
}
