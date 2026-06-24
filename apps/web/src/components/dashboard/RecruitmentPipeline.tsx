import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';

interface PipelineItem {
    stage: string;
    count: number;
    color: string;
}

interface RecruitmentPipelineProps {
    data: PipelineItem[];
    maxCount: number;
}

export default function RecruitmentPipeline({ data, maxCount }: RecruitmentPipelineProps) {
    return (
        <div className="xl:col-span-1 bg-white rounded-2xl p-5 border border-[#F2F2F7]">
            <h3 className="text-[14px] text-[#1D1D1F] tracking-[-0.01em] mb-1" style={{ fontFamily: SF, fontWeight: 600 }}>
                Phễu tuyển dụng
            </h3>
            <p className="text-[12px] text-[#6E6E73] mb-4">Tổng ứng viên theo giai đoạn</p>
            {data.every(d => d.count === 0) ? (
                <div className="py-8 text-center">
                    <p className="text-[13px] text-[#AEAEB2]">Chưa có dữ liệu</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {data.map(({ stage, count, color }) => (
                        <div key={stage}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[12px] text-[#6E6E73]">{stage}</span>
                                <span className="text-[12px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>{count}</span>
                            </div>
                            <div className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: maxCount > 0 ? `${(count / maxCount) * 100}%` : '0%',
                                        background: color,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Link
                href="/jobs"
                className="flex items-center justify-center gap-2 w-full mt-5 py-2.5 border border-[#E5E5EA] hover:border-[#D2D2D7] hover:bg-[#F5F5F7] text-[#1D1D1F] rounded-xl text-[13px] transition-all"
                style={{ fontFamily: SFT, fontWeight: 500 }}
            >
                Xem Tin tuyển dụng <ArrowRight className="w-3.5 h-3.5" />
            </Link>
        </div>
    );
}
