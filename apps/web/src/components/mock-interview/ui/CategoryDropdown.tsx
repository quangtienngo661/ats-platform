'use client';

import { Select } from '@/components/ui';

interface CategoryDropdownProps {
    categories: string[];
    selectedCategory: string | null;
    onSelectCategory: (category: string | null) => void;
}

export function CategoryDropdown({ categories, selectedCategory, onSelectCategory }: CategoryDropdownProps) {
    return (
        <Select
            size="sm"
            aria-label="Lọc theo nhóm chủ đề"
            className="w-full sm:w-52"
            value={selectedCategory ?? ''}
            onChange={(e) => onSelectCategory(e.target.value || null)}
        >
            <option value="">Tất cả chủ đề</option>
            {categories.map((cat) => (
                <option key={cat} value={cat}>
                    {cat}
                </option>
            ))}
        </Select>
    );
}
