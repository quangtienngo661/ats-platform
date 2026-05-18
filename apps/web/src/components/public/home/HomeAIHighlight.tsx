import Link from 'next/link';
import { Bot, Sparkles, Zap, ArrowRight, ScanLine } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';

export function HomeAIHighlight() {
    return (
        <section className="bg-gradient-to-b from-[#F5F5F7] to-white py-20 border-b border-[#E5E5EA]">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Text Content */}
                    <div>
                        <div className="inline-flex items-center gap-2 bg-[#EBF3FD] text-[#0071E3] rounded-full px-4 py-1.5 text-[12px] mb-6" style={{ fontFamily: SFT, fontWeight: 600 }}>
                            <Bot className="w-4 h-4" />
                            AI-Powered ATS Platform
                        </div>
                        <h2 className="text-[34px] lg:text-[42px] text-[#1D1D1F] tracking-[-0.03em] leading-[1.2] mb-6" style={{ fontFamily: SF, fontWeight: 700 }}>
                            Để AI đánh giá CV thay bạn trong <span className="text-[#0071E3]">5 giây</span>
                        </h2>
                        <p className="text-[17px] text-[#6E6E73] leading-[1.6] mb-8" style={{ fontFamily: SFT }}>
                            TalentAI sử dụng công nghệ LLM tiên tiến nhất để đọc hiểu, phân tích và trích xuất dữ liệu từ CV của bạn. Nhận ngay phản hồi về điểm mạnh, điểm yếu so với yêu cầu công việc.
                        </p>

                        <div className="space-y-5 mb-10">
                            {[
                                { icon: ScanLine, text: 'Bóc tách dữ liệu tự động không cần nhập tay' },
                                { icon: Sparkles, text: 'Đánh giá độ phù hợp (Match Score) chính xác' },
                                { icon: Zap, text: 'Nhận Feedback cá nhân hóa để cải thiện hồ sơ' },
                            ].map((feature, i) => {
                                const Icon = feature.icon;
                                return (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#EBF3FD] flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-5 h-5 text-[#0071E3]" />
                                        </div>
                                        <p className="text-[15px] text-[#1D1D1F]" style={{ fontFamily: SFT, fontWeight: 500 }}>
                                            {feature.text}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        <Link
                            href="/my-cvs"
                            className="inline-flex items-center gap-2 bg-[#1D1D1F] hover:bg-[#333336] text-white rounded-xl px-8 py-4 text-[15px] transition-all shadow-md"
                            style={{ fontFamily: SFT, fontWeight: 600 }}
                        >
                            <ScanLine className="w-5 h-5" />
                            Phân tích CV ngay
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </div>

                    {/* Visual/Mockup */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#0071E3]/10 to-[#6366F1]/10 rounded-[32px] blur-3xl transform -rotate-6"></div>
                        <div className="relative bg-white border border-[#E5E5EA] rounded-[32px] p-8 shadow-xl">
                            {/* Mockup Header */}
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#F2F2F7]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0071E3] to-[#6366F1] flex items-center justify-center shadow-inner">
                                        <Bot className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-[17px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>AI Agent Review</h3>
                                        <p className="text-[13px] text-[#0071E3]">Đang phân tích Frontend Developer CV...</p>
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-full border-4 border-[#34C759] flex items-center justify-center">
                                    <span className="text-[15px] text-[#34C759]" style={{ fontFamily: SF, fontWeight: 700 }}>92</span>
                                </div>
                            </div>
                            
                            {/* Mockup Body */}
                            <div className="space-y-4">
                                <div className="h-2 w-full bg-[#F5F5F7] rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-[#0071E3] to-[#6366F1] w-[95%]"></div>
                                </div>
                                <div className="flex justify-between text-[12px] text-[#6E6E73] mb-6">
                                    <span>Kinh nghiệm làm việc</span>
                                    <span className="text-[#1D1D1F]" style={{ fontWeight: 600 }}>Tuyệt vời</span>
                                </div>

                                <div className="h-2 w-full bg-[#F5F5F7] rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-[#0071E3] to-[#6366F1] w-[85%]"></div>
                                </div>
                                <div className="flex justify-between text-[12px] text-[#6E6E73] mb-6">
                                    <span>Kỹ năng kỹ thuật</span>
                                    <span className="text-[#1D1D1F]" style={{ fontWeight: 600 }}>Khá tốt</span>
                                </div>

                                <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-4 mt-6">
                                    <p className="text-[13px] text-[#166534] leading-[1.6]">
                                        <span style={{ fontWeight: 600 }}>Điểm mạnh:</span> Ứng viên có 5 năm kinh nghiệm làm việc với React.js và hệ sinh thái liên quan. Phù hợp 95% với Job Description.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
