'use client';

import { useMemo, useRef, useState } from 'react';
import { FolderTree, Search, SearchX } from 'lucide-react';
import { Button, EmptyState, Input, Surface } from '@/components/ui';
import { JobCategoryHeader } from './ui/JobCategoryHeader';
import { JobCategoryStats } from './ui/JobCategoryStats';
import { JobCategoryTree } from './ui/JobCategoryTree';
import { MutateJobCategoryModal } from './ui/MutateJobCategoryModal';
import { visibleCategoryNodes } from './categoryTree';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import { deleteJobCategoryAction } from '@/servers/job-categories/job-categories.action';
import { toast } from '@/lib/toast';

interface JobCategoryClientProps {
    categories: IJobCategoryDto[];
}

export default function JobCategoryClient({ categories }: JobCategoryClientProps) {
    const [showMutateModal, setShowMutateModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<IJobCategoryDto | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    const nodes = useMemo(() => visibleCategoryNodes(categories, searchQuery), [categories, searchQuery]);

    const handleAdd = (parentId?: string) => {
        setEditingCategory(parentId ? { categoryId: '', name: '', parentCategoryId: parentId } : null);
        setShowMutateModal(true);
    };

    const handleEdit = (category: IJobCategoryDto) => {
        setEditingCategory(category);
        setShowMutateModal(true);
    };

    const handleDelete = async (category: IJobCategoryDto) => {
        const result = await deleteJobCategoryAction(category.categoryId);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    const handleCloseModal = () => {
        setShowMutateModal(false);
        setEditingCategory(null);
    };

    const clearSearch = () => {
        setSearchQuery('');
        // The "Xóa tìm kiếm" button disappears with the no-match state; keep focus in the toolbar.
        searchRef.current?.focus();
    };

    return (
        <div className="space-y-4 p-4 lg:p-6">
            <JobCategoryHeader onAdd={() => handleAdd()}>
                <div className="relative w-full sm:w-56">
                    <Search
                        aria-hidden="true"
                        strokeWidth={1.75}
                        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
                    />
                    <Input
                        ref={searchRef}
                        aria-label="Tìm danh mục"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm theo tên danh mục…"
                        className="pl-8"
                    />
                </div>
            </JobCategoryHeader>
            <JobCategoryStats categories={categories} />

            {categories.length === 0 ? (
                <Surface>
                    <EmptyState
                        icon={FolderTree}
                        title="Chưa có danh mục"
                        description="Danh mục bạn tạo sẽ hiện ở đây."
                        action={<Button onClick={() => handleAdd()}>Thêm danh mục đầu tiên</Button>}
                    />
                </Surface>
            ) : nodes.length === 0 ? (
                <Surface>
                    <EmptyState
                        icon={SearchX}
                        title="Không có danh mục khớp"
                        description="Đổi từ khóa tìm kiếm."
                        action={<Button variant="secondary" onClick={clearSearch}>Xóa tìm kiếm</Button>}
                    />
                </Surface>
            ) : (
                <JobCategoryTree
                    nodes={nodes}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddChild={handleAdd}
                />
            )}

            {showMutateModal && (
                <MutateJobCategoryModal
                    onClose={handleCloseModal}
                    editingCategory={editingCategory}
                    parentCategories={categories}
                />
            )}
        </div>
    );
}
