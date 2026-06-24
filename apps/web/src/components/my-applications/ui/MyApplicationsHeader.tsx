import { Briefcase } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';

export function MyApplicationsHeader() {
    return (
        <div className="mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6366F1] flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1
                        className="text-[24px] text-[#1D1D1F] tracking-[-0.02em]"
                        style={{ fontFamily: SF, fontWeight: 700 }}
                    >
                        Đơn ứng tuyển
                    </h1>
                    <p className="text-[13px] text-[#6E6E73]" style={{ fontFamily: SFT }}>
                        Theo dõi tiến trình ứng tuyển của bạn
                    </p>
                </div>
            </div>
        </div>
    );
}
