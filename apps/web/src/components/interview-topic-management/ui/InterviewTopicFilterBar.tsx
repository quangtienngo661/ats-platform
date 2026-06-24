import { Search } from 'lucide-react';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';

interface InterviewTopicFilterBarProps {
    categories: IJobCategoryDto[];
    onSearch: (value: string) => void;
    onCategoryChange: (value: string) => void;
}

export function InterviewTopicFilterBar({ categories, onSearch, onCategoryChange }: InterviewTopicFilterBarProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEAEB2]" />
                <input
                    type="search"
                    onChange={(event) => onSearch(event.target.value)}
                    placeholder="Tìm theo tên chủ đề hoặc danh mục"
                    className="w-full rounded-xl border border-[#E5E5EA] bg-white py-2.5 pl-9 pr-3 text-[13px] outline-none transition-all focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/10"
                />
            </div>
            <select
                onChange={(event) => onCategoryChange(event.target.value)}
                className="appearance-none pl-4 pr-8 py-2.5 text-[13px] border border-[#E5E5EA] rounded-xl outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/10 transition-all bg-white cursor-pointer"
            >
                <option value="">Tất cả danh mục</option>
                {categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
                ))}
            </select>
        </div>
    );
}