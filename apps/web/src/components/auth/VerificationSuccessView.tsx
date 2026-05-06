'use client';

import { motion } from 'motion/react';
import { CheckCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import Link from 'next/link';

export default function VerificationSuccessView() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-[24px] shadow-xl shadow-black/8 border border-[#E5E5EA] overflow-hidden"
        >
            <div className="p-8">
                {/* Success animation */}
                <div className="flex justify-center mb-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
                        className="w-20 h-20 rounded-full bg-[#E8F5E9] flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
                        >
                            <CheckCircle className="w-10 h-10 text-[#34C759]" />
                        </motion.div>
                    </motion.div>
                </div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-[22px] text-center text-[#1D1D1F] mb-2 tracking-[-0.02em]"
                    style={{ fontFamily: SF, fontWeight: 700 }}
                >
                    Xác thực email thành công!
                </motion.h1>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-[14px] text-center text-[#6E6E73] leading-relaxed mb-8"
                    style={{ fontFamily: SFT }}
                >
                    Tài khoản của bạn đã được kích hoạt thành công.
                    <br />
                    Bây giờ bạn có thể đăng nhập và trải nghiệm các tính năng của TalentAI.
                </motion.p>

                {/* Features */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-[#F5F5F7] rounded-2xl p-5 mb-6"
                >
                    <div className="space-y-3">
                        {[
                            { icon: Sparkles, text: 'Hồ sơ AI-Driven được tạo tự động từ CV' },
                            { icon: ShieldCheck, text: 'Quản lý đơn ứng tuyển dễ dàng' },
                        ].map(({ icon: Icon, text }, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <Icon className="w-4 h-4 text-[#0071E3]" />
                                </div>
                                <p className="text-[13px] text-[#1D1D1F]" style={{ fontFamily: SFT }}>
                                    {text}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                >
                    <Link
                        href="/sign-in"
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl text-[14px] transition-all shadow-sm shadow-[#0071E3]/20"
                        style={{ fontFamily: SFT, fontWeight: 500 }}
                    >
                        Đến trang Đăng nhập
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </div>
        </motion.div>
    );
}
