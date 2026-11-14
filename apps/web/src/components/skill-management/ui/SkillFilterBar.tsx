'use client';

import type { Ref } from 'react';
import { Search } from 'lucide-react';
import { Input, Select } from '@/components/ui';

interface SkillFilterBarProps {
    categories: string[];
    search: string;
    category: string;
    onSearch: (query: string) => void;
    onCategoryChange: (category: string) => void;
    /** Lets the list put focus back in the search field after clearing the filters. */
    searchRef?: Ref<HTMLInputElement>;
}

/** Controlled, so the list's "Xóa tìm kiếm" / "Xóa bộ lọc" can reset every field at once. */
export function SkillFilterBar({
    categories,
    search,
    category,
    onSearch,
    onCategoryChange,
    searchRef,
}: SkillFilterBarProps) {
    return (
        <>
            <div className="relative w-full sm:w-56">
                <Search
                    aria-hidden="true"
                    strokeWidth={1.75}
                    className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
                />
                <Input
                    ref={searchRef}
                    aria-label="Tìm kỹ năng"
                    type="search"
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Tìm kiếm kỹ năng…"
                    className="pl-8"
                />
            </div>

            <Select
                aria-label="Lọc danh mục kỹ năng"
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full sm:w-44"
            >
                <option value="">Tất cả danh mục</option>
                {categories.map((cat) => (
                    <option key={cat} value={cat}>
                        {cat}
                    </option>
                ))}
            </Select>
        </>
    );
}
