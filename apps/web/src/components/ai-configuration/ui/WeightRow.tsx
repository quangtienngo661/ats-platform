'use client';

import { SF } from "@/types/fonts/fonts";

export function WeightRow({
    color, label, weight,
    onWeightChange,
    disabled = false,
}: {
    color: string;
    label: string;
    weight: number;
    onWeightChange: (v: number) => void;
    disabled?: boolean;
}) {
    return (
        <div className={`p-4 rounded-2xl border bg-[#FAFAFA] space-y-3 transition-colors ${disabled ? 'border-[#F2F2F7] opacity-70' : 'border-[#E5E5EA]'}`}>
            {/* Label row */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-[13px] text-[#1D1D1F] truncate" style={{ fontWeight: 500 }}>
                        {label}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input
                        type="number" min="0" max="100" value={weight}
                        disabled={disabled}
                        onChange={(e) => onWeightChange(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                        className="w-14 px-2 py-1 text-center text-[13px] border border-[#E5E5EA] rounded-lg focus:border-[#0071E3] outline-none bg-white disabled:bg-[#F5F5F7] disabled:cursor-not-allowed"
                        style={{ fontFamily: SF, fontWeight: 700 }}
                    />
                    <span className="text-[12px] text-[#AEAEB2]">%</span>
                </div>
            </div>

            {/* Slider */}
            <input
                type="range" min="0" max="100" value={weight}
                disabled={disabled}
                onChange={(e) => onWeightChange(parseInt(e.target.value))}
                className="w-full disabled:cursor-not-allowed"
                style={{ accentColor: disabled ? '#D1D1D6' : color }}
            />
        </div>
    );
}