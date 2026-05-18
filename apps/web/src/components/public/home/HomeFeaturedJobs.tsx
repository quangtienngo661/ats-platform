import Link from 'next/link';
import { ArrowRight, Briefcase } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';

export function HomeFeaturedJobs() {
    return (
        <section className="bg-white py-20 border-b border-[#E5E5EA]">
            <div className="max-w-[1200px] mx-auto px-6 text-center">
                <div className="w-16 h-16 bg-[#F5F5F7] rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="w-8 h-8 text-[#0071E3]" />
                </div>
                <h2 className="text-[32px] text-[#1D1D1F] tracking-[-0.02em] mb-4" style={{ fontFamily: SF, fontWeight: 700 }}>
                    Hàng Ngàn Cơ Hội Đang Chờ Đón
                </h2>
                <p className="text-[17px] text-[#6E6E73] max-w-[600px] mx-auto mb-8" style={{ fontFamily: SFT }}>
                    Khám phá các vị trí tuyển dụng mới nhất từ các công ty hàng đầu. Đừng bỏ lỡ cơ hội phát triển sự nghiệp của bạn.
                </p>
                <Link
                    href="/job-postings"
                    className="inline-flex items-center justify-center gap-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-xl px-8 py-4 text-[15px] transition-all shadow-sm"
                    style={{ fontFamily: SFT, fontWeight: 600 }}
                >
                    Xem Các Việc Làm Nổi Bật
                    <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        </section>
    );
}
