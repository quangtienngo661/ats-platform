import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';

interface StaffAuthShellProps {
    children: React.ReactNode;
}

export function StaffAuthShell({ children }: StaffAuthShellProps) {
    return (
        <div
            className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #0D0D1A 0%, #111827 50%, #0D0D1A 100%)',
                fontFamily: SFT,
            }}
        >
            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Purple blob - top right */}
                <div
                    className="absolute top-[-120px] right-[-120px] w-[500px] h-[500px] rounded-full opacity-[0.18]"
                    style={{
                        background: 'radial-gradient(circle, #7C3AED 0%, transparent 65%)',
                        animation: 'float1 8s ease-in-out infinite',
                    }}
                />
                {/* Teal blob - bottom left */}
                <div
                    className="absolute bottom-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full opacity-[0.14]"
                    style={{
                        background: 'radial-gradient(circle, #0D9488 0%, transparent 65%)',
                        animation: 'float2 10s ease-in-out infinite',
                    }}
                />
                {/* Blue blob - center */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-[0.06]"
                    style={{
                        background: 'radial-gradient(ellipse, #3B82F6 0%, transparent 70%)',
                    }}
                />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />
            </div>

            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
                <div
                    key={i}
                    className="absolute rounded-full opacity-20 pointer-events-none"
                    style={{
                        width: `${4 + (i % 3) * 2}px`,
                        height: `${4 + (i % 3) * 2}px`,
                        background: i % 2 === 0 ? '#A78BFA' : '#34D399',
                        top: `${15 + i * 14}%`,
                        left: `${8 + i * 15}%`,
                        animation: `float${(i % 2) + 1} ${7 + i}s ease-in-out infinite`,
                        animationDelay: `${i * 0.8}s`,
                    }}
                />
            ))}

            <style>{`
                @keyframes float1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-20px, 20px) scale(1.05); }
                }
                @keyframes float2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(15px, -15px) scale(1.03); }
                }
            `}</style>

            <div className="w-full max-w-[440px] relative z-10">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div
                            className="w-10 h-10 rounded-[13px] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                            style={{
                                background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                                boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                            }}
                        >
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span
                                className="text-[19px] text-white block leading-none"
                                style={{ fontFamily: SF, fontWeight: 700 }}
                            >
                                TalentAI
                            </span>
                            <span
                                className="text-[10px] text-white/40 tracking-widest uppercase"
                                style={{ fontFamily: SFT }}
                            >
                                Internal Portal
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Card */}
                {children}

                {/* Security notice */}
                <p
                    className="text-center text-[11px] text-white/25 mt-6 px-4"
                    style={{ fontFamily: SFT }}
                >
                    🔒 Kết nối bảo mật — Chỉ dành cho nhân viên được ủy quyền
                </p>
            </div>
        </div>
    );
}
