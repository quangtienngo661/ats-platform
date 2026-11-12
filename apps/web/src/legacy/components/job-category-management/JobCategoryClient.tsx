'use client';

import { useState } from 'react';
import { SFT } from '@/types/fonts/fonts';
import { JobCategoryHeader } from './ui/JobCategoryHeader';
import { JobCategoryStats } from './ui/JobCategoryStats';
import { JobCategoryTree } from './ui/JobCategoryTree';
import { MutateJobCategoryModal } from './ui/MutateJobCategoryModal';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import { deleteJobCategoryAction } from '@/servers/job-categories/job-categories.action';
import { toast } from '@/lib/toast';

interface JobCategoryClientProps {
    categories: IJobCategoryDto[];
}

export default function JobCategoryClient({ categories }: JobCategoryClientProps) {
    const [showMutateModal, setShowMutateModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<IJobCategoryDto | null>(null);

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

    return (
        <div className="p-6 lg:p-8" style={{ fontFamily: SFT }}>
            <JobCategoryHeader onAdd={() => handleAdd()} />
            <JobCategoryStats categories={categories} />
            <JobCategoryTree
                categories={categories}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddChild={handleAdd}
            />

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
