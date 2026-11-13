'use client';

import { useRef, useState } from 'react';
import { Building2, SearchX } from 'lucide-react';
import { Button, EmptyState, Stagger, Surface } from '@/components/ui';
import { DepartmentHeader } from './ui/DepartmentHeader';
import { DepartmentStats } from './ui/DepartmentStats';
import { DepartmentCard } from './ui/DepartmentCard';
import { MutateDepartmentModal } from './ui/MutateDepartmentModal';
import { DepartmentDetailModal } from './ui/DepartmentDetailModal';
import { Department } from '@/types/interfaces/departments.interface';
import { deleteDepartmentAction, DepartmentState } from '@/servers/departments/departments.action';
import { toast } from '@/lib/toast';
import { IOrganizationOption } from '@ats-platform/types';

interface DepartmentClientProps {
    departments: Department[];
    /** Non-empty only for a platform admin — see getOrganizationOptionsForCurrentUser. */
    organizations: IOrganizationOption[];
}

export default function DepartmentClient({ departments, organizations }: DepartmentClientProps) {
    const [showMutateModal, setShowMutateModal] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [isEdited, setIsEdited] = useState(false);
    const [dept, setDept] = useState<Department | null>(null);
    const [search, setSearch] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    const query = search.trim().toLowerCase();
    const filtered = query
        ? departments.filter((d) => [d.name, d.description].some((value) => value?.toLowerCase().includes(query)))
        : departments;

    const clearSearch = () => {
        setSearch('');
        // The "Xóa tìm kiếm" button disappears with the no-match state; keep focus in the toolbar.
        searchRef.current?.focus();
    };

    const handleAdd = () => setShowMutateModal(true);

    const handleEdit = (department: Department) => {
        setShowMutateModal(true)
        setEditingDept(department)
        setIsEdited(true)
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
        <div className="space-y-4 p-4 lg:p-6">
            <DepartmentHeader onAdd={handleAdd} search={search} onSearchChange={setSearch} searchRef={searchRef} />
            <DepartmentStats departments={departments} />

            {departments.length === 0 ? (
                <Surface>
                    <EmptyState
                        icon={Building2}
                        title="Chưa có phòng ban"
                        description="Tạo phòng ban trước khi thêm nhà tuyển dụng."
                        action={<Button onClick={handleAdd}>Thêm phòng ban đầu tiên</Button>}
                    />
                </Surface>
            ) : filtered.length === 0 ? (
                <Surface>
                    <EmptyState
                        icon={SearchX}
                        title="Không có phòng ban khớp"
                        description="Đổi từ khóa tìm kiếm."
                        action={<Button variant="secondary" onClick={clearSearch}>Xóa tìm kiếm</Button>}
                    />
                </Surface>
            ) : (
                <Stagger as="ul" className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((dept) => (
                        <li key={dept.departmentId} className="min-w-0">
                            <DepartmentCard
                                department={dept}
                                organizationName={organizations.find(org => org.organizationId === dept.organizationId)?.name}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onViewDetail={handleViewDetail}
                            />
                        </li>
                    ))}
                </Stagger>
            )}

            {showMutateModal && <MutateDepartmentModal
                onClose={() => { setShowMutateModal(false); setIsEdited(false) }}
                isEdited={isEdited}
                editingDept={editingDept}
                organizations={organizations}
                onResult={handleActionComplete}
            />}
            {dept && <DepartmentDetailModal department={dept} onClose={() => setDept(null)} />}
        </div>
    );
}
