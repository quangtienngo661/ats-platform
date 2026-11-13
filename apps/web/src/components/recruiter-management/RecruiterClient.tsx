'use client';

import { useRef, useState } from 'react';
import { SearchX, Users } from 'lucide-react';
import { Button, EmptyState, Stagger, Surface } from '@/components/ui';
import { RecruiterHeader } from './ui/RecruiterHeader';
import { RecruiterStats } from './ui/RecruiterStats';
import { RecruiterCard } from './ui/RecruiterCard';
import { MutateRecruiterModal } from './ui/MutateRecruiterModal';
import { RecruiterDetailModal } from './ui/RecruiterDetailModal';
import { IRecruiterDto } from '@/types/interfaces/recruiter.interface';
import { RecruiterActionState, deleteRecruiterAction } from '@/servers/recruiters/recruiters.action';
import { toast } from '@/lib/toast';
import { IUserDto } from '@ats-platform/types';

interface DepartmentOption {
    departmentId: string;
    name: string;
    /** The department's own colour; empty for "Chưa phân bổ", which is drawn in a neutral token instead. */
    color: string;
}

interface RecruiterClientProps {
    recruiters: IRecruiterDto[];
    departments: DepartmentOption[];
    users: IUserDto[];
    canAssignExisting?: boolean;
}

export default function RecruiterClient({ recruiters, departments, users, canAssignExisting = false }: RecruiterClientProps) {
    const [showMutateModal, setShowMutateModal] = useState(false);
    const [editingRecruiter, setEditingRecruiter] = useState<IRecruiterDto | null>(null);
    const [isEdited, setIsEdited] = useState(false);
    const [detailRecruiter, setDetailRecruiter] = useState<IRecruiterDto | null>(null);
    const [search, setSearch] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    // Helper: get department info by id
    const getDepartment = (departmentId?: string): DepartmentOption => {
        if (!departmentId) return { departmentId: '', name: 'Chưa phân bổ', color: '' };
        return (
            departments.find((d) => {
                return d.departmentId === departmentId
            }) ?? {
                departmentId,
                name: 'Chưa phân bổ',
                color: '',
            }
        );
    };

    const query = search.trim().toLowerCase();
    const filtered = query
        ? recruiters.filter((recruiter) =>
            [
                recruiter.user?.fullName,
                recruiter.user?.email,
                recruiter.position,
                getDepartment(recruiter.department?.departmentId).name,
            ].some((value) => value?.toLowerCase().includes(query)),
        )
        : recruiters;

    const clearSearch = () => {
        setSearch('');
        // The "Xóa tìm kiếm" button disappears with the no-match state; keep focus in the toolbar.
        searchRef.current?.focus();
    };

    const handleAdd = () => {
        setEditingRecruiter(null);
        setIsEdited(false);
        setShowMutateModal(true);
    };

    const handleEdit = (recruiter: IRecruiterDto) => {
        setEditingRecruiter(recruiter);
        setIsEdited(true);
        setShowMutateModal(true);
    };

    const handleDelete = async (recruiter: IRecruiterDto) => {
        const result = await deleteRecruiterAction(recruiter.recruiterId);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    const handleViewDetail = (id: string) => {
        const found = recruiters.find((r) => r.recruiterId === id);
        if (found) setDetailRecruiter(found);
    };

    const handleActionComplete = (result: RecruiterActionState) => {
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    return (
        <div className="space-y-4 p-4 lg:p-6">
            <RecruiterHeader onAdd={handleAdd} search={search} onSearchChange={setSearch} searchRef={searchRef} />
            <RecruiterStats recruiters={recruiters} />

            {recruiters.length === 0 ? (
                <Surface>
                    <EmptyState
                        icon={Users}
                        title="Chưa có nhà tuyển dụng"
                        description="Mỗi nhà tuyển dụng cần thuộc một phòng ban."
                        action={<Button onClick={handleAdd}>Thêm nhà tuyển dụng đầu tiên</Button>}
                    />
                </Surface>
            ) : filtered.length === 0 ? (
                <Surface>
                    <EmptyState
                        icon={SearchX}
                        title="Không có nhà tuyển dụng khớp"
                        description="Đổi từ khóa tìm kiếm."
                        action={<Button variant="secondary" onClick={clearSearch}>Xóa tìm kiếm</Button>}
                    />
                </Surface>
            ) : (
                <Stagger as="ul" className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((recruiter) => {
                        const dept = getDepartment(recruiter.department?.departmentId);
                        return (
                            <li key={recruiter.recruiterId} className="min-w-0">
                                <RecruiterCard
                                    recruiter={recruiter}
                                    departmentName={dept.name}
                                    departmentColor={dept.color}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onViewDetail={handleViewDetail}
                                />
                            </li>
                        );
                    })}
                </Stagger>
            )}

            {showMutateModal && (
                <MutateRecruiterModal
                    onClose={() => {
                        setShowMutateModal(false);
                        setIsEdited(false);
                    }}
                    isEdited={isEdited}
                    editingRecruiter={editingRecruiter}
                    departments={departments}
                    users={users}
                    canAssignExisting={canAssignExisting}
                    onResult={handleActionComplete}
                />
            )}

            {detailRecruiter && (
                <RecruiterDetailModal
                    recruiter={detailRecruiter}
                    departmentName={getDepartment(detailRecruiter.department?.departmentId).name}
                    departmentColor={getDepartment(detailRecruiter.department?.departmentId).color}
                    onClose={() => setDetailRecruiter(null)}
                    onEdit={(r) => {
                        setDetailRecruiter(null);
                        handleEdit(r);
                    }}
                    onDelete={(r) => {
                        setDetailRecruiter(null);
                        handleDelete(r);
                    }}
                />
            )}
        </div>
    );
}
