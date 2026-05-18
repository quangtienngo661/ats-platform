import { Cpu, MessageCircle } from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';

interface ChatMessage {
    id: string;
    role: 'ai' | 'candidate';
    content: string;
    type: 'question' | 'answer' | 'followup' | 'followup_answer' | 'system';
    questionIndex?: number;
}

interface ChatBubbleProps {
    message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
    const isAi = message.role === 'ai';
    const isSystem = message.type === 'system';

    // System messages (welcome, completion)
    if (isSystem) {
        return (
            <div className="flex justify-center my-2">
                <div className="bg-white/80 backdrop-blur-sm border border-[#E5E5EA] rounded-2xl px-4 py-3 max-w-[480px] text-center shadow-sm">
                    <p className="text-[12px] text-[#6E6E73] leading-relaxed" style={{ fontFamily: SFT }}>
                        {message.content}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex gap-2.5 min-w-0 ${isAi ? 'justify-start' : 'justify-end'}`}>
            {/* AI avatar */}
            {isAi && (
                <div className="flex-shrink-0 mt-1">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0071E3] to-[#6366F1] flex items-center justify-center">
                        <Cpu className="w-3.5 h-3.5 text-white" />
                    </div>
                </div>
            )}

            <div className={`max-w-[75%] min-w-0 ${isAi ? '' : 'order-first'}`}>
                {/* Question label */}
                {message.type === 'question' && message.questionIndex && (
                    <p className="text-[10px] text-[#AEAEB2] mb-1 ml-1" style={{ fontWeight: 600 }}>
                        Câu {message.questionIndex}
                    </p>
                )}
                {message.type === 'followup' && (
                    <p className="text-[10px] text-[#6366F1] mb-1 ml-1" style={{ fontWeight: 600 }}>
                        Câu hỏi bổ sung
                    </p>
                )}

                {/* Bubble */}
                <div
                    className={`rounded-2xl px-4 py-3 ${isAi
                        ? 'bg-white border border-[#E5E5EA] rounded-tl-md'
                        : message.type === 'followup_answer'
                            ? 'bg-[#6366F1] text-white rounded-tr-md'
                            : 'bg-[#0071E3] text-white rounded-tr-md'
                        }`}
                    style={{ boxShadow: isAi ? '0 1px 3px rgba(0,0,0,0.04)' : undefined }}
                >
                    <p
                        className={`text-[13px] leading-[1.6] whitespace-pre-wrap break-words overflow-wrap-anywhere ${isAi ? 'text-[#1D1D1F]' : 'text-white'}`}
                        style={{ fontFamily: SFT, wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                    >
                        {message.content}
                    </p>
                </div>
            </div>

            {/* Candidate avatar */}
            {!isAi && (
                <div className="flex-shrink-0 mt-1">
                    <div className="w-7 h-7 rounded-lg bg-[#0071E3] flex items-center justify-center">
                        <MessageCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                </div>
            )}
        </div>
    );
}
