import ResetPasswordForm from '@/components/auth/forms/ResetPasswordForm';
import { AuthShell } from '@/components/auth/ui/AuthShell';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Đặt lại mật khẩu | TalentAI',
    description: 'Tạo mật khẩu mới cho tài khoản TalentAI',
};

interface ResetPasswordPageProps {
    searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
    const { token } = await searchParams;

    return (
        <AuthShell showTerms={false}>
            {token ? (
                <ResetPasswordForm token={token} />
            ) : (
                /* No token → invalid link */
                <div className="bg-white rounded-[24px] shadow-xl shadow-black/8 border border-[#E5E5EA] p-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-[#FFE5E5] flex items-center justify-center mx-auto mb-5">
                        <AlertTriangle className="w-7 h-7 text-[#FF3B30]" />
                    </div>
                    <h1 className="text-[20px] text-[#1D1D1F] tracking-[-0.02em] mb-2" style={{ fontFamily: SF, fontWeight: 700 }}>
                        Link không hợp lệ
                    </h1>
                    <p className="text-[14px] text-[#6E6E73] mb-6" style={{ fontFamily: SFT }}>
                        Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.
                    </p>
                    <Link
                        href="/forgot-password"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0071E3] text-white rounded-xl text-[13px] hover:bg-[#0077ED] transition-all"
                        style={{ fontFamily: SFT, fontWeight: 500 }}
                    >
                        Yêu cầu link mới
                    </Link>
                    <div className="mt-4">
                        <Link
                            href="/sign-in"
                            className="inline-flex items-center gap-1.5 text-[13px] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Quay về đăng nhập
                        </Link>
                    </div>
                </div>
            )}
        </AuthShell>
    );
}
