'use client';

import { Search, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SF } from '@/types/fonts/fonts';

interface SkillFilterBarProps {
    categories: string[];
    onSearch: (query: string) => void;
    onCategoryChange: (category: string) => void;
}

export function SkillFilterBar({ categories, onSearch, onCategoryChange }: SkillFilterBarProps) {
    const [query, setQuery] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = (value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onSearch(value), 300);
    };

    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    return (
        <div className="flex items-center gap-3 mb-5 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-[#AEAEB2] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Tìm kiếm kỹ năng..."
                    className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-[#E5E5EA] rounded-xl outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/10 transition-all bg-white"
                    style={{ fontFamily: SF }}
                />
            </div>

            {/* Category filter */}
            <div className="relative">
                <select
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="appearance-none pl-4 pr-8 py-2.5 text-[13px] border border-[#E5E5EA] rounded-xl outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/10 transition-all bg-white cursor-pointer"
                    style={{ fontFamily: SF }}
                >
                    <option value="">Tất cả danh mục</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#AEAEB2] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
        </div>
    );
}
