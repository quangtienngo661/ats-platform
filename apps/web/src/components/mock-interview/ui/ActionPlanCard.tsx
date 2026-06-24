import { Lightbulb } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';

interface ActionPlanCardProps {
    actionPlan: string;
}

export function ActionPlanCard({ actionPlan }: ActionPlanCardProps) {
    return (
        <div className="bg-gradient-to-br from-[#EBF3FD] to-[#F5F3FF] rounded-2xl border border-[#E5E5EA] p-5">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <Lightbulb className="w-3.5 h-3.5 text-[#F59E0B]" />
                </div>
                <span className="text-[13px] text-[#1D1D1F]" style={{ fontFamily: SF, fontWeight: 600 }}>
                    Kế hoạch cải thiện
                </span>
            </div>
            <p className="text-[13px] text-[#1D1D1F] leading-[1.7]" style={{ fontFamily: SFT }}>
                {actionPlan}
            </p>
        </div>
    );
}
