'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ChevronRight, ChevronDown, Edit2, Trash2, Plus,
    FolderOpen, Folder, Briefcase,
} from 'lucide-react';
import { SF, SFT } from '@/types/fonts/fonts';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';

// ── Colors for parent categories ──────────────────────────────────────────────
const CATEGORY_COLORS = ['#6366F1', '#0EA5E9', '#F59E0B', '#34C759', '#EC4899', '#0071E3'];

// ── Child Row (no state needed — but lives inside client parent) ─────────────
function ChildCategoryRow({
    category,
    onEdit,
    onDelete,
}: {
    category: IJobCategoryDto;
    onEdit: (cat: IJobCategoryDto) => void;
    onDelete: (cat: IJobCategoryDto) => void;
}) {
    return (
        <div className="group flex items-center gap-3 px-5 py-3 hover:bg-[#F5F5F7] transition-colors border-t border-[#F2F2F7]">
            {/* Indent */}
            <div className="w-5 h-5 ml-6 flex-shrink-0" />

            {/* Icon */}
            <div className="w-7 h-7 rounded-lg bg-[#F5F5F7] flex items-center justify-center flex-shrink-0">
                <Folder className="w-3.5 h-3.5 text-[#AEAEB2]" />
            </div>

            {/* Name */}
            <span className="flex-1 text-[13px] text-[#1D1D1F]" style={{ fontWeight: 500 }}>
                {category.name}
            </span>

            {/* Job count badge */}
            <div className="flex items-center gap-1.5 mr-2">
                <Briefcase className="w-3 h-3 text-[#AEAEB2]" />
                <span className="text-[11px] text-[#AEAEB2]">{category.jobPostingsCount || 0}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit(category)}
                    className="p-1.5 rounded-lg text-[#6366F1] hover:bg-[#F5F3FF] transition-colors"
                >
                    <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => onDelete(category)}
                    className="p-1.5 rounded-lg text-[#FF3B30] hover:bg-[#FFE5E5] transition-colors"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

// ── Parent Category Row ──────────────────────────────────────────────────────
function ParentCategoryRow({
    category,
    colorIndex,
    onEdit,
    onDelete,
    onAddChild,
}: {
    category: IJobCategoryDto;
    colorIndex: number;
    onEdit: (cat: IJobCategoryDto) => void;
    onDelete: (cat: IJobCategoryDto) => void;
    onAddChild: (parentId: string) => void;
}) {
    const [expanded, setExpanded] = useState(true);
    const color = CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length];
    const childCount = category.childCategories?.length || 0;

    return (
        <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden hover:shadow-md hover:shadow-black/5 transition-all">
            {/* Parent row */}
            <div className="group flex items-center gap-3 px-5 py-4">
                {/* Expand toggle */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-[#AEAEB2] hover:text-[#6E6E73] transition-colors"
                    disabled={childCount === 0}
                >
                    {childCount > 0 ? (
                        expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                    ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E5E5EA]" />
                    )}
                </button>

                {/* Icon */}
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15` }}
                >
                    {expanded && childCount > 0
                        ? <FolderOpen className="w-4.5 h-4.5" style={{ color }} />
                        : <Folder className="w-4.5 h-4.5" style={{ color }} />
                    }
                </div>

                {/* Name + child count */}
                <div className="flex-1 min-w-0">
                    <p
                        className="text-[15px] text-[#1D1D1F] tracking-[-0.01em] truncate"
                        style={{ fontFamily: SF, fontWeight: 600 }}
                    >
                        {category.name}
                    </p>
                    <p className="text-[11px] text-[#AEAEB2] mt-0.5">
                        {childCount} danh mục con
                    </p>
                </div>

                {/* Job count */}
                <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg flex-shrink-0"
                    style={{ background: `${color}10` }}
                >
                    <Briefcase className="w-3 h-3" style={{ color }} />
                    <span className="text-[11px]" style={{ color, fontWeight: 600 }}>
                        {category.jobPostingsCount || 0} việc làm
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                        onClick={() => onAddChild(category.categoryId)}
                        className="p-1.5 rounded-lg text-[#34C759] hover:bg-[#E8F5E9] transition-colors"
                        title="Thêm danh mục con"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onEdit(category)}
                        className="p-1.5 rounded-lg text-[#6366F1] hover:bg-[#F5F3FF] transition-colors"
                        title="Sửa"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onDelete(category)}
                        className="p-1.5 rounded-lg text-[#FF3B30] hover:bg-[#FFE5E5] transition-colors"
                        title="Xóa"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Children */}
            <AnimatePresence initial={false}>
                {expanded && childCount > 0 && (
                    <motion.div
                        key="children"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="overflow-hidden"
                    >
                        {category.childCategories!.map((child) => (
                            <ChildCategoryRow
                                key={child.categoryId}
                                category={child}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Tree Container ───────────────────────────────────────────────────────────
interface JobCategoryTreeProps {
    categories: IJobCategoryDto[];
    onEdit: (cat: IJobCategoryDto) => void;
    onDelete: (cat: IJobCategoryDto) => void;
    onAddChild: (parentId: string) => void;
}

export function JobCategoryTree({ categories, onEdit, onDelete, onAddChild }: JobCategoryTreeProps) {
    return (
        <div className="flex flex-col gap-3">
            {categories
                .filter(cat => !cat.parentCategoryId)
                .map((cat, index) =>
                    <ParentCategoryRow
                        key={cat.categoryId}
                        category={cat}
                        colorIndex={index}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onAddChild={onAddChild}
                    />
                )}

            {categories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#E5E5EA]">
                    <FolderOpen className="w-10 h-10 text-[#AEAEB2] mb-3" />
                    <p className="text-[15px] text-[#6E6E73]" style={{ fontWeight: 500 }}>
                        Chưa có danh mục nào
                    </p>
                    <p className="text-[12px] text-[#AEAEB2] mt-1">
                        Hãy tạo danh mục đầu tiên để bắt đầu
                    </p>
                </div>
            )}
        </div>
    );
}
