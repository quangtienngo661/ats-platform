// "use client"

import { Building2, Edit2, Trash2, Users, ChevronRight } from 'lucide-react';
import { SF } from '@/types/fonts/fonts';

import { Department } from '@/types/interfaces/departments.interface';
import { MutateDepartmentModal } from './MutateDepartmentModal';
import { useState } from 'react';


interface DepartmentCardProps {
    department: Department;
    onEdit: (dept: Department) => void;
    onDelete: (dept: Department) => void;
    onViewDetail: (id: string) => void;
}

export function DepartmentCard({ department: dept, onEdit, onDelete, onViewDetail }: DepartmentCardProps) {
    // const [showAddModal, setShowAddModal] = useState(false);
    return (
        <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 hover:shadow-lg hover:shadow-black/5 transition-all">
            <div className="flex items-start justify-between mb-4">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${dept.color}15` }}
                >
                    <Building2 className="w-6 h-6" style={{ color: dept.color }} />
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onEdit(dept)}
                        className="p-2 rounded-lg text-[#0071E3] hover:bg-[#EBF3FD] transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(dept)}
                        className="p-2 rounded-lg text-[#FF3B30] hover:bg-[#FFE5E5] transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    {/* {showAddModal && <AddDepartmentModal onClose={() => setShowAddModal(false)} />} */}
                </div>
            </div>

            <h3
                className="text-[17px] text-[#1D1D1F] mb-1 tracking-[-0.01em]"
                style={{ fontFamily: SF, fontWeight: 600 }}
            >
                {dept.name}
            </h3>
            <p className="text-[13px] text-[#6E6E73] leading-relaxed mb-4">{dept.description}</p>

            <div className="flex items-center justify-between pt-4 border-t border-[#F2F2F7]">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#AEAEB2]" />
                    <span className="text-[13px] text-[#6E6E73]">{dept.membersCount} thành viên</span>
                </div>
                <button
                    onClick={() => onViewDetail(dept.departmentId)}
                    className="flex items-center gap-1 text-[12px] text-[#0071E3] hover:underline"
                    style={{ fontWeight: 500 }}
                >
                    Xem chi tiết
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
