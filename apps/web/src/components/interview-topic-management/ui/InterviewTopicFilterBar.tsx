'use client';

import type { Ref } from 'react';
import { Search } from 'lucide-react';
import { Input, Select } from '@/components/ui';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';

interface InterviewTopicFilterBarProps {
    categories: IJobCategoryDto[];
    search: string;
    categoryId: string;
    onSearch: (value: string) => void;
    onCategoryChange: (value: string) => void;
    /** Lets the list put focus back in the search field after clearing the filters. */
    searchRef?: Ref<HTMLInputElement>;
}

/** Controlled, so the list's "Xóa tìm kiếm" / "Xóa bộ lọc" can reset every field at once. */
export function InterviewTopicFilterBar({
    categories,
    search,
    categoryId,
    onSearch,
    onCategoryChange,
    searchRef,
}: InterviewTopicFilterBarProps) {
    return (
        <>
            <div className="relative w-full sm:w-64">
                <Search
                    aria-hidden="true"
                    strokeWidth={1.75}
                    className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
                />
                <Input
                    ref={searchRef}
                    aria-label="Tìm chủ đề phỏng vấn"
                    type="search"
                    value={search}
                    onChange={(event) => onSearch(event.target.value)}
                    placeholder="Tìm theo tên chủ đề hoặc danh mục"
                    className="pl-8"
                />
            </div>
            <Select
                aria-label="Lọc danh mục chủ đề"
                value={categoryId}
                onChange={(event) => onCategoryChange(event.target.value)}
                className="w-full sm:w-44"
            >
                <option value="">Tất cả danh mục</option>
                {categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                        {category.name}
                    </option>
                ))}
            </Select>
        </>
    );
}
