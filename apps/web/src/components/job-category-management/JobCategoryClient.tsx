'use client';

import { useState } from 'react';
import { SFT } from '@/types/fonts/fonts';
import { JobCategoryHeader } from './ui/JobCategoryHeader';
import { JobCategoryStats } from './ui/JobCategoryStats';
import { JobCategoryTree } from './ui/JobCategoryTree';
import { MutateJobCategoryModal } from './ui/MutateJobCategoryModal';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';

interface JobCategoryClientProps {
    categories: IJobCategoryDto[];
}

export default function JobCategoryClient({ categories }: JobCategoryClientProps) {
    const [showMutateModal, setShowMutateModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<IJobCategoryDto | null>(null);

    // Flatten all categories for parent selection dropdown
    const allCategories = categories.reduce<IJobCategoryDto[]>((acc, cat) => {
        acc.push(cat);
        if (cat.childCategories) acc.push(...cat.childCategories);
        return acc;
    }, []);

    const handleAdd = (parentId?: string) => {
        setEditingCategory(parentId ? { categoryId: '', name: '', parentCategoryId: parentId } : null);
        setShowMutateModal(true);
    };

    const handleEdit = (category: IJobCategoryDto) => {
        setEditingCategory(category);
        setShowMutateModal(true);
    };

    const handleDelete = async (category: IJobCategoryDto) => {
        // TODO: connect to deleteCategoryAction
        // const result = await deleteJobCategoryAction(category.categoryId);
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
