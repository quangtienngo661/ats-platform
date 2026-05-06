'use client';

import { SF, SFT } from '@/types/fonts/fonts';
import { TrendingUp } from 'lucide-react';
import {
    AreaChart, Area,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface ApplicationsTrendChartProps {
    data: { month: string; value: number }[];
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-[#E5E5EA] rounded-xl px-3 py-2 shadow-lg shadow-black/10">
            <p className="text-[11px] text-[#6E6E73] mb-0.5" style={{ fontFamily: SFT }}>{label}</p>
            <p className="text-[13px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
                {payload[0].value} ứng viên
            </p>
        </div>
    );
}

export default function ApplicationsTrendChart({ data }: ApplicationsTrendChartProps) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-[#F2F2F7] mb-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-[14px] text-[#1D1D1F] tracking-[-0.01em]" style={{ fontFamily: SF, fontWeight: 600 }}>
                        Ứng tuyển theo thời gian
                    </h3>
                    <p className="text-[12px] text-[#6E6E73] mt-0.5">6 tháng gần nhất</p>
                </div>
            </div>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0071E3" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#0071E3" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#F2F2F7" strokeDasharray="4 4" vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: '#AEAEB2', fontSize: 11, fontFamily: SFT }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#AEAEB2', fontSize: 11, fontFamily: SFT }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={false} />
                        <Area type="monotone" dataKey="value" stroke="#0071E3" strokeWidth={2} fill="url(#blueGrad)" dot={{ fill: '#0071E3', r: 4, strokeWidth: 2, stroke: '#fff' }} />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-[180px] flex items-center justify-center">
                    <p className="text-[13px] text-[#AEAEB2]">Chưa có dữ liệu ứng tuyển</p>
                </div>
            )}
        </div>
    );
}
