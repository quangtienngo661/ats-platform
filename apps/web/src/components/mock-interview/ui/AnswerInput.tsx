'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { SFT } from '@/types/fonts/fonts';

const MAX_HEIGHT = 200; // px — sau đó scroll bên trong, không expand thêm

interface AnswerInputProps {
    onSubmit: (text: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function AnswerInput({ onSubmit, disabled = false, placeholder = 'Nhập câu trả lời...' }: AnswerInputProps) {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-expand chiều cao — reset về 'auto' trước để tính lại đúng scrollHeight
    const adjustHeight = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, MAX_HEIGHT) + 'px';
        // Chỉ scroll bên trong khi đã đạt maxHeight
        el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
    }, []);

    useEffect(() => {
        adjustHeight();
    }, [text, adjustHeight]);

    const handleSubmit = () => {
        const trimmed = text.trim();
        if (!trimmed || disabled) return;
        onSubmit(trimmed);
        setText('');
        // Reset chiều cao sau khi clear
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.overflowY = 'hidden';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="border-t border-[#F2F2F7] bg-white px-5 py-3">
            <div className="max-w-[720px] mx-auto flex items-end gap-3">
                <div className="flex-1">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        placeholder={placeholder}
                        rows={1}
                        className={[
                            'w-full rounded-xl border px-4 py-2.5',
                            'text-[13px] text-[#1D1D1F] placeholder-[#AEAEB2]',
                            'outline-none transition-all duration-200',
                            // Ẩn scrollbar trên mọi trình duyệt
                            '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                            // Bỏ resize handle hoàn toàn
                            'resize-none',
                            disabled
                                ? 'bg-[#F5F5F7] border-[#E5E5EA] opacity-50 cursor-not-allowed'
                                : 'bg-[#F5F5F7] border-[#E5E5EA] focus:border-[#0071E3] focus:bg-white focus:shadow-sm focus:shadow-[#0071E3]/10',
                        ].join(' ')}
                        style={{ fontFamily: SFT, overflowY: 'hidden' }}
                    />
                    <p className="text-[10px] text-[#AEAEB2] mt-1 ml-1">
                        Enter để gửi · Shift+Enter để xuống dòng
                    </p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={!text.trim() || disabled}
                    className="flex-shrink-0 mb-[25.5px] w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-[#0071E3] hover:bg-[#0077ED] active:scale-95 text-white shadow-sm shadow-[#0071E3]/20"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
