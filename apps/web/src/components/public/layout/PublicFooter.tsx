import Link from 'next/link';
import { Mail } from 'lucide-react';
// import { Github, Linkedin, Mail } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';

export function PublicFooter() {
    return (
        <footer className="bg-white border-t border-[#E5E5EA] mt-16 " style={{ fontFamily: SFT }}>
            <div className="max-w-[1200px] mx-auto px-6 py-10">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                    {/* Brand */}
                    <div>
                        <span className="text-[16px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 700 }}>TalentAI</span>
                        <p className="text-[13px] text-[#AEAEB2] mt-1.5 max-w-[240px] leading-[1.6]">
                            Nền tảng tuyển dụng thông minh — kết nối ứng viên với cơ hội phù hợp.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="flex flex-wrap gap-12">
                        <div>
                            <p className="text-[12px] uppercase tracking-[0.07em] text-[#AEAEB2] mb-3" style={{ fontWeight: 600 }}>Ứng viên</p>
                            <nav className="flex flex-col gap-2">
                                <Link href="/job-postings" className="text-[13px] text-[#6E6E73] hover:text-[#0071E3] transition-colors">Tìm việc làm</Link>
                                <Link href="/profile" className="text-[13px] text-[#6E6E73] hover:text-[#0071E3] transition-colors">Hồ sơ của tôi</Link>
                                <Link href="/my-applications" className="text-[13px] text-[#6E6E73] hover:text-[#0071E3] transition-colors">Đơn ứng tuyển</Link>
                            </nav>
                        </div>
                        <div>
                            <p className="text-[12px] uppercase tracking-[0.07em] text-[#AEAEB2] mb-3" style={{ fontWeight: 600 }}>Nhà tuyển dụng</p>
                            <nav className="flex flex-col gap-2">
                                <Link href="/sign-in" className="text-[13px] text-[#6E6E73] hover:text-[#0071E3] transition-colors">Đăng nhập HR</Link>
                            </nav>
                        </div>
                    </div>
                </div>

                <div className="border-t border-[#F2F2F7] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[12px] text-[#AEAEB2]">© 2026 TalentAI. All rights reserved.</p>
                    <div className="flex items-center gap-3">
                        <a href="#" className="p-2 rounded-lg text-[#AEAEB2] hover:text-[#0071E3] hover:bg-[#EBF3FD] transition-colors">
                            {/* <Github className="w-4 h-4" /> */}
                        </a>
                        <a href="#" className="p-2 rounded-lg text-[#AEAEB2] hover:text-[#0071E3] hover:bg-[#EBF3FD] transition-colors">
                            {/* <Linkedin className="w-4 h-4" /> */}
                        </a>
                        <a href="#" className="p-2 rounded-lg text-[#AEAEB2] hover:text-[#0071E3] hover:bg-[#EBF3FD] transition-colors">
                            <Mail className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
