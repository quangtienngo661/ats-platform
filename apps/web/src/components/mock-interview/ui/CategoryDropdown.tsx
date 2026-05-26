'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Filter, Check } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';

interface CategoryDropdownProps {
    categories: string[];
    selectedCategory: string | null;
    onSelectCategory: (category: string | null) => void;
}

export function CategoryDropdown({ categories, selectedCategory, onSelectCategory }: CategoryDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative z-20" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] border transition-all duration-200 ${
                    isOpen
                        ? 'border-[#0071E3] bg-[#EBF3FD] text-[#0071E3]'
                        : 'border-[#E5E5EA] bg-white text-[#1D1D1F] hover:border-[#AEAEB2] hover:bg-[#F5F5F7]'
                }`}
                style={{ fontFamily: SF, fontWeight: 500 }}
            >
                <Filter className="w-3.5 h-3.5 text-[#86868B]" />
                <span>{selectedCategory || 'Tất cả chủ đề'}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#86868B] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.12, ease: 'easeOut' }}
                        className="absolute right-0 mt-1.5 w-[210px] rounded-xl bg-white border border-[#E5E5EA] shadow-lg py-1.5 overflow-hidden origin-top-right"
                    >
                        {/* Option: Tất cả */}
                        <button
                            type="button"
                            onClick={() => {
                                onSelectCategory(null);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] text-left transition-colors ${
                                selectedCategory === null
                                    ? 'bg-[#F5F5F7] text-[#0071E3]'
                                    : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                            }`}
                            style={{ fontFamily: SF, fontWeight: selectedCategory === null ? 600 : 400 }}
                        >
                            <span>Tất cả chủ đề</span>
                            {selectedCategory === null && <Check className="w-3.5 h-3.5 text-[#0071E3]" />}
                        </button>

                        <div className="h-[1px] bg-[#E5E5EA] my-1" />

                        {/* List of categories */}
                        {categories.map((cat) => {
                            const isSelected = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => {
                                        onSelectCategory(cat);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] text-left transition-colors ${
                                        isSelected
                                            ? 'bg-[#F5F5F7] text-[#0071E3]'
                                            : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                                    }`}
                                    style={{ fontFamily: SF, fontWeight: isSelected ? 600 : 400 }}
                                >
                                    <span className="truncate">{cat}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-[#0071E3]" />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
