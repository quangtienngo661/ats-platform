'use client';

import { useMemo, useState } from 'react';
import { SFT } from '@/types/fonts/fonts';
import { SkillHeader } from './ui/SkillHeader';
import { SkillStats } from './ui/SkillStats';
import { SkillFilterBar } from './ui/SkillFilterBar';
import { SkillTable } from './ui/SkillTable';
import { AddSkillModal } from './ui/AddSkillModal';
import { EditSkillModal } from './ui/EditSkillModal';
import { ISkillDto } from '@/types/interfaces/skill.interface';
import { deleteSkillAction } from '@/servers/skills/skills.action';
import { toast } from '@/lib/toast';


interface SkillClientProps {
    skills: ISkillDto[];
}

export default function SkillClient({ skills }: SkillClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSkill, setEditingSkill] = useState<ISkillDto | null>(null);

    // Unique categories derived from current skills list
    const categories = useMemo(() => {
        const cats = skills.map((s) => s.category).filter((c): c is string => !!c);
        return [...new Set(cats)].sort();
    }, [skills]);

    // Client-side filter
    const filtered = useMemo(() => {
        return skills.filter((s) => {
            const q = searchQuery.toLowerCase();
            const matchName = !q || s.name.toLowerCase().includes(q);
            const matchCat = !selectedCategory || s.category === selectedCategory;
            return matchName && matchCat;
        });
    }, [skills, searchQuery, selectedCategory]);


    const handleDelete = async (skillId: string) => {
        const result = await deleteSkillAction(skillId);
        if (result.success) {
            toast.success('Thành công', result.message);
        } else {
            toast.error('Lỗi', result.message);
        }
    };

    return (
        <div className="p-6 lg:p-8" style={{ fontFamily: SFT }}>
            <SkillHeader onAdd={() => setShowAddModal(true)} />
            <SkillStats skills={filtered} />
            <SkillFilterBar
                categories={categories}
                onSearch={setSearchQuery}
                onCategoryChange={setSelectedCategory}
            />
            <SkillTable
                skills={filtered}
                onEdit={setEditingSkill}
                onDelete={handleDelete}
            />

            {showAddModal && (
                <AddSkillModal
                    existingCategories={categories}
                    onClose={() => setShowAddModal(false)}
                />
            )}

            {editingSkill && (
                <EditSkillModal
                    skill={editingSkill}
                    existingCategories={categories}
                    onClose={() => setEditingSkill(null)}
                />
            )}
        </div>
    );
}
