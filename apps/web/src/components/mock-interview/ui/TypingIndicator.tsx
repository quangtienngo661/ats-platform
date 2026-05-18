import { SFT } from '@/types/fonts/fonts';

export function TypingIndicator() {
    return (
        <div className="flex gap-2.5 justify-start">
            {/* AI avatar */}
            <div className="flex-shrink-0 mt-1">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0071E3] to-[#6366F1] flex items-center justify-center">
                    <span className="text-white text-[9px]" style={{ fontWeight: 700 }}>AI</span>
                </div>
            </div>

            {/* Typing bubble */}
            <div className="bg-white border border-[#E5E5EA] rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-[#AEAEB2] rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                        <div className="w-2 h-2 bg-[#AEAEB2] rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }} />
                        <div className="w-2 h-2 bg-[#AEAEB2] rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }} />
                    </div>
                    <span className="text-[11px] text-[#AEAEB2] ml-1" style={{ fontFamily: SFT }}>
                        AI đang phân tích...
                    </span>
                </div>
            </div>
        </div>
    );
}
