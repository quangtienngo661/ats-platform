import { TrendingUp, TrendingDown } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';

// Xác định màu sắc dựa trên điểm
function getScoreConfig(score: number) {
    if (score >= 80) return { color: '#34C759', bg: '#F0FDF4', ringColor: '#34C759', label: 'Xuất sắc' };
    if (score >= 60) return { color: '#F59E0B', bg: '#FFFBEB', ringColor: '#F59E0B', label: 'Khá' };
    return { color: '#FF3B30', bg: '#FEF2F2', ringColor: '#FF3B30', label: 'Cần cải thiện' };
}

interface ScoreOverviewProps {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
}

export function ScoreOverview({ overallScore, strengths, weaknesses }: ScoreOverviewProps) {
    const config = getScoreConfig(overallScore);
    const circumference = 2 * Math.PI * 52;
    const strokeDashoffset = circumference - (overallScore / 100) * circumference;

    return (
        <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-6">
                {/* Score Ring */}
                <div className="flex flex-col items-center flex-shrink-0">
                    <div className="relative w-[130px] h-[130px]">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                            {/* Background ring */}
                            <circle cx="60" cy="60" r="52" fill="none" stroke="#F2F2F7" strokeWidth="8" />
                            {/* Score ring */}
                            <circle
                                cx="60" cy="60" r="52" fill="none"
                                stroke={config.ringColor}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[28px] leading-none" style={{ fontFamily: SF, fontWeight: 800, color: config.color }}>
                                {Math.round(overallScore)}
                            </span>
                            <span className="text-[11px] text-[#AEAEB2] mt-0.5" style={{ fontWeight: 500 }}>/100</span>
                        </div>
                    </div>
                    <span
                        className="mt-2 text-[12px] rounded-full px-3 py-1"
                        style={{ background: config.bg, color: config.color, fontWeight: 600 }}
                    >
                        {config.label}
                    </span>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-2.5">
                            <TrendingUp className="w-3.5 h-3.5 text-[#34C759]" />
                            <span className="text-[12px] text-[#34C759]" style={{ fontFamily: SF, fontWeight: 600 }}>
                                Điểm mạnh
                            </span>
                        </div>
                        <ul className="space-y-2">
                            {strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#34C759] mt-1.5 flex-shrink-0" />
                                    <p className="text-[12px] text-[#1D1D1F] leading-[1.5]" style={{ fontFamily: SFT }}>
                                        {s}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Weaknesses */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-2.5">
                            <TrendingDown className="w-3.5 h-3.5 text-[#FF3B30]" />
                            <span className="text-[12px] text-[#FF3B30]" style={{ fontFamily: SF, fontWeight: 600 }}>
                                Cần cải thiện
                            </span>
                        </div>
                        <ul className="space-y-2">
                            {weaknesses.map((w, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] mt-1.5 flex-shrink-0" />
                                    <p className="text-[12px] text-[#1D1D1F] leading-[1.5]" style={{ fontFamily: SFT }}>
                                        {w}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
