'use client';

import { useState, useActionState } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import Link from 'next/link';
import { resetPasswordAction } from '@/servers/auth/auth.action';

const initialState = { success: false, message: '' };

interface ResetPasswordFormProps {
    token: string;
}

function StrengthBar({ password }: { password: string }) {
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    const score = checks.filter(Boolean).length;
    const labels = ['', 'Yếu', 'Trung bình', 'Tốt', 'Mạnh'];
    const colors = ['', '#FF3B30', '#FF9500', '#0071E3', '#34C759'];

    if (!password) return null;

    return (
        <div className="mt-2">
            <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all"
                        style={{ background: i <= score ? colors[score] : '#E5E5EA' }}
                    />
                ))}
            </div>
            <p className="text-[11px] transition-colors" style={{ color: colors[score] }}>
                {labels[score]}
            </p>
        </div>
    );
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [state, formAction] = useActionState(resetPasswordAction, initialState);

    const reqs = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[^A-Za-z0-9]/.test(password),
    };
    const pwMatch = password === confirmPassword && confirmPassword !== '';
    const canSubmit = Object.values(reqs).every(Boolean) && pwMatch;

    const INPUT_CLS = "w-full pl-4 pr-10 py-3 rounded-xl border border-[#E5E5EA] focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10 outline-none transition-all text-[14px]";

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
                        <Lock className="w-6 h-6 text-[#0071E3]" />
                    </div>
                    <h1 className="text-[22px] text-[#1D1D1F] tracking-[-0.02em] mb-1" style={{ fontFamily: SF, fontWeight: 700 }}>
                        Đặt lại mật khẩu
                    </h1>
                    <p className="text-[14px] text-[#6E6E73] mb-6" style={{ fontFamily: SFT }}>
                        Tạo mật khẩu mới cho tài khoản của bạn.
                    </p>

                    <form action={formAction} className="flex flex-col gap-4">
                        {/* Hidden token */}
                        <input type="hidden" name="token" value={token} />

                        {/* Password */}
                        <div>
                            <label className="block text-[13px] text-[#1D1D1F] mb-1.5" style={{ fontWeight: 500 }}>Mật khẩu mới</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Nhập mật khẩu mới"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={INPUT_CLS}
                                    style={{ fontFamily: SFT }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AEAEB2] hover:text-[#6E6E73] transition-colors"
                                >
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <StrengthBar password={password} />
                        </div>

                        {/* Requirements */}
                        {password && (
                            <div className="bg-[#F5F5F7] rounded-xl p-3">
                                <ul className="space-y-1">
                                    {[
                                        { met: reqs.length, label: 'Ít nhất 8 ký tự' },
                                        { met: reqs.upper, label: 'Ít nhất 1 chữ hoa' },
                                        { met: reqs.number, label: 'Ít nhất 1 chữ số' },
                                        { met: reqs.symbol, label: 'Ít nhất 1 ký tự đặc biệt' },
                                    ].map(({ met, label }) => (
                                        <li key={label} className={`text-[11px] flex items-center gap-1.5 transition-colors ${met ? 'text-[#34C759]' : 'text-[#AEAEB2]'}`}>
                                            <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                            {label}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Confirm */}
                        <div>
                            <label className="block text-[13px] text-[#1D1D1F] mb-1.5" style={{ fontWeight: 500 }}>Xác nhận mật khẩu</label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Nhập lại mật khẩu mới"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={INPUT_CLS}
                                    style={{ fontFamily: SFT }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AEAEB2] hover:text-[#6E6E73] transition-colors"
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {confirmPassword && !pwMatch && (
                                <p className="text-[11px] text-[#FF3B30] mt-1.5" style={{ fontFamily: SFT }}>
                                    Mật khẩu không khớp
                                </p>
                            )}
                            {confirmPassword && pwMatch && (
                                <p className="text-[11px] text-[#34C759] mt-1.5" style={{ fontFamily: SFT }}>
                                    ✓ Mật khẩu khớp
                                </p>
                            )}
                        </div>

                        {/* Error */}
                        {state.message && !state.success && (
                            <p className="text-[#FF3B30] text-[13px] text-center" style={{ fontFamily: SFT }}>
                                {state.message}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="w-full py-3 bg-[#0071E3] hover:bg-[#0077ED] disabled:bg-[#E5E5EA] disabled:text-[#AEAEB2] text-white rounded-xl text-[14px] transition-all shadow-sm disabled:shadow-none disabled:cursor-not-allowed"
                            style={{ fontFamily: SFT, fontWeight: 500 }}
                        >
                            Đặt lại mật khẩu
                        </button>
                    </form>
                </>
            ) : (
                <div className="text-center py-2">
                    <div className="w-14 h-14 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto mb-5">
                        <CheckCircle className="w-7 h-7 text-[#34C759]" />
                    </div>
                    <h1 className="text-[20px] text-[#1D1D1F] tracking-[-0.02em] mb-2" style={{ fontFamily: SF, fontWeight: 700 }}>
                        Mật khẩu đã được đặt lại!
                    </h1>
                    <p className="text-[14px] text-[#6E6E73] mb-6" style={{ fontFamily: SFT }}>
                        Tất cả phiên đăng nhập cũ đã bị thu hồi. Bạn có thể đăng nhập bằng mật khẩu mới.
                    </p>
                    <Link
                        href="/sign-in"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0071E3] text-white rounded-xl text-[13px] hover:bg-[#0077ED] transition-all"
                        style={{ fontFamily: SFT, fontWeight: 500 }}
                    >
                        Đăng nhập ngay
                    </Link>
                </div>
            )}

            {!state.success && (
                <div className="mt-6 pt-5 border-t border-[#F2F2F7]">
                    <Link
                        href="/sign-in"
                        className="flex items-center justify-center gap-1.5 text-[13px] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Quay về đăng nhập
                    </Link>
                </div>
            )}
        </motion.div>
    );
}
