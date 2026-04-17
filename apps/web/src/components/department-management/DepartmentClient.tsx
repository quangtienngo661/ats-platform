'use client';

import { useState } from 'react';
import { SFT } from '@/types/fonts/fonts';
import { DepartmentHeader } from './ui/DepartmentHeader';
import { DepartmentStats } from './ui/DepartmentStats';
import { DepartmentCard } from './ui/DepartmentCard';
import { MutateDepartmentModal } from './ui/MutateDepartmentModal';
import { DepartmentDetailModal } from './ui/DepartmentDetailModal';
import { Department } from '@/types/interfaces/departments.interface';
import { deleteDepartmentAction, DepartmentState, updateDepartmentAction } from '@/servers/departments/departments.action';
import { toast } from '@/lib/toast';

interface DepartmentClientProps {
    departments: Department[];
}


export default function DepartmentClient({ departments }: DepartmentClientProps) {
    const [showMutateModal, setShowMutateModal] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [isEdited, setIsEdited] = useState(false);
    const [dept, setDept] = useState<Department | null>(null);

    const handleEdit = (department: Department) => {
        setShowMutateModal(true)
        setEditingDept(department)
        setIsEdited(true)
        // const result = updateDepartmentAction()
    };

    const handleDelete = async (department: Department) => {
        const result = await deleteDepartmentAction(department);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    }

    const handleViewDetail = (id: string) => {
        const detail = departments.find(d => d.departmentId === id);
        if (detail) setDept(detail);
    };

    const handleActionComplete = (result: DepartmentState) => {
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    }

    return (
        <div className="p-6 lg:p-8" style={{ fontFamily: SFT }}>
            <DepartmentHeader onAdd={() => setShowMutateModal(true)} />
            <DepartmentStats departments={departments} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                    <DepartmentCard
                        key={dept.departmentId}
                        department={dept}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onViewDetail={handleViewDetail}
                    />
                ))}
            </div>

            {showMutateModal && <MutateDepartmentModal
                onClose={() => { setShowMutateModal(false); setIsEdited(false) }}
                isEdited={isEdited}
                editingDept={editingDept}
                onResult={handleActionComplete}
            />}
            {dept && <DepartmentDetailModal department={dept} onClose={() => setDept(null)} />}
        </div>
    );
}
