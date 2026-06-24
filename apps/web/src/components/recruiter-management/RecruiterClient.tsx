'use client';

import { useState } from 'react';
import { SFT } from '@/types/fonts/fonts';
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
    color: string;
}

interface RecruiterClientProps {
    recruiters: IRecruiterDto[];
    departments: DepartmentOption[];
    users: IUserDto[];
}

export default function RecruiterClient({ recruiters, departments, users }: RecruiterClientProps) {
    const [showMutateModal, setShowMutateModal] = useState(false);
    const [editingRecruiter, setEditingRecruiter] = useState<IRecruiterDto | null>(null);
    const [isEdited, setIsEdited] = useState(false);
    const [detailRecruiter, setDetailRecruiter] = useState<IRecruiterDto | null>(null);

    // Helper: get department info by id
    const getDepartment = (departmentId?: string): DepartmentOption => {
        if (!departmentId) return { departmentId: '', name: 'Chưa phân bổ', color: '#AEAEB2' };
        return (
            departments.find((d) => {
                return d.departmentId === departmentId
            }) ?? {
                departmentId,
                name: 'Chưa phân bổ',
                color: '#AEAEB2',
            }
        );
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
        <div className="p-6 lg:p-8" style={{ fontFamily: SFT }}>
            <RecruiterHeader onAdd={handleAdd} />
            <RecruiterStats recruiters={recruiters} />

            {recruiters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#F5F5F7] flex items-center justify-center mb-4">
                        <span className="text-3xl">👥</span>
                    </div>
                    <p className="text-[16px] text-[#1D1D1F] font-semibold mb-1">Chưa có nhà tuyển dụng</p>
                    <p className="text-[13px] text-[#6E6E73]">Nhấn "Thêm nhà tuyển dụng" để bắt đầu</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recruiters.map((recruiter) => {
                        const dept = getDepartment(recruiter.department?.departmentId);
                        return (
                            <RecruiterCard
                                key={recruiter.recruiterId}
                                recruiter={recruiter}
                                departmentName={dept.name}
                                departmentColor={dept.color}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onViewDetail={handleViewDetail}
                            />
                        );
                    })}
                </div>
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
