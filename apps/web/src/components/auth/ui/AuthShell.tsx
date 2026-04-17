import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';

interface AuthShellProps {
    children: React.ReactNode;
    showTerms?: boolean;
}

export function AuthShell({ children, showTerms = true }: AuthShellProps) {
    return (
        <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6" style={{ fontFamily: SFT }}>
            {/* Background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full opacity-[0.06]"
                    style={{ background: 'radial-gradient(circle, #0071E3 0%, transparent 70%)' }}
                />
                <div
                    className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-[0.04]"
                    style={{ background: 'radial-gradient(circle, #34AADC 0%, transparent 70%)' }}
                />
            </div>

            <div className="w-full max-w-[440px] relative z-10">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-[11px] bg-[#0071E3] flex items-center justify-center shadow-lg shadow-[#0071E3]/20">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[19px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
                            TalentAI
                        </span>
                    </Link>
                </div>

                {/* Card */}
                {children}

                {/* Terms footer */}
                {showTerms && (
                    <p className="text-center text-[11px] text-[#AEAEB2] mt-6 px-4" style={{ fontFamily: SFT }}>
                        Bằng cách sử dụng dịch vụ, bạn đồng ý với{' '}
                        <a href="#" className="text-[#0071E3] hover:underline">Điều khoản dịch vụ</a> và{' '}
                        <a href="#" className="text-[#0071E3] hover:underline">Chính sách bảo mật</a>.
                    </p>
                )}
            </div>
        </div>
    );
}
