'use client';

import { useRef, useEffect } from 'react';
import { Bold, Italic, List } from 'lucide-react';
import { SFT } from '@/types/fonts/fonts';

interface RichTextEditorProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);

    // Sync external value changes (only if editor is empty or on mount)
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const format = (command: string) => {
        document.execCommand(command, false, undefined);
        handleInput();
        editorRef.current?.focus();
    };

    return (
        <div className="w-full rounded-xl border border-[#E5E5EA] overflow-hidden focus-within:border-[#0071E3] focus-within:ring-2 focus-within:ring-[#0071E3]/10 transition-all bg-white flex flex-col">
            <div className="flex items-center gap-1 p-2 border-b border-[#F2F2F7] bg-[#FAFAFC]">
                <button
                    type="button"
                    onClick={() => format('bold')}
                    className="p-1.5 rounded-lg hover:bg-[#E5E5EA] text-[#1D1D1F] transition-colors"
                    title="In đậm"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => format('italic')}
                    className="p-1.5 rounded-lg hover:bg-[#E5E5EA] text-[#1D1D1F] transition-colors"
                    title="In nghiêng"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-[#E5E5EA] mx-1" />
                <button
                    type="button"
                    onClick={() => format('insertUnorderedList')}
                    className="p-1.5 rounded-lg hover:bg-[#E5E5EA] text-[#1D1D1F] transition-colors"
                    title="Danh sách"
                >
                    <List className="w-4 h-4" />
                </button>
            </div>
            
            <style jsx global>{`
                .rich-text-editor-content {
                    outline: none;
                }
                .rich-text-editor-content ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin-top: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .rich-text-editor-content p {
                    margin-bottom: 0.5rem;
                }
                .rich-text-editor-content[data-placeholder]:empty:before {
                    content: attr(data-placeholder);
                    color: #AEAEB2;
                    pointer-events: none;
                    display: block; /* For Firefox */
                }
            `}</style>
            
            <div
                ref={editorRef}
                className="rich-text-editor-content p-4 min-h-[200px] max-h-[400px] overflow-y-auto text-[14px] text-[#1D1D1F]"
                style={{ fontFamily: SFT }}
                contentEditable
                onInput={handleInput}
                onBlur={handleInput}
                data-placeholder={placeholder}
            />
        </div>
    );
}
