'use client';

import { useMemo, useState } from 'react';
import { SFT } from '@/types/fonts/fonts';
import { SkillHeader } from './ui/SkillHeader';
import { SkillStats } from './ui/SkillStats';
import { SkillFilterBar } from './ui/SkillFilterBar';
import { SkillTable } from './ui/SkillTable';
import { AddSkillModal } from './ui/AddSkillModal';
import { EditSkillModal } from './ui/EditSkillModal';
import { SERVER_URL } from '@/types/constants/urls';

export interface SkillDto {
    skillId: string;
    name: string;
    category?: string | null;
}

interface SkillClientProps {
    initialSkills: SkillDto[];
}

export default function SkillClient({ initialSkills }: SkillClientProps) {
    const [skills, setSkills] = useState<SkillDto[]>(initialSkills);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSkill, setEditingSkill] = useState<SkillDto | null>(null);

    // Unique categories derived from current skills list
    const categories = useMemo(() => {
        const cats = skills.map((s) => s.category).filter((c): c is string => !!c);
        return [...new Set(cats)].sort();
    }, [skills]);

    // Client-side filter
    const filtered = useMemo(() => {
        return skills.filter((s) => {
            const matchName = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchCat = !selectedCategory || s.category === selectedCategory;
            return matchName && matchCat;
        });
    }, [skills, searchQuery, selectedCategory]);

    // CRUD handlers — optimistic local state update
    const handleCreated = (skill: SkillDto) => {
        setSkills((prev) => [skill, ...prev]);
    };

    const handleUpdated = (updated: SkillDto) => {
        setSkills((prev) => prev.map((s) => s.skillId === updated.skillId ? updated : s));
    };

    const handleDelete = async (skillId: string) => {
        // Optimistic remove
        setSkills((prev) => prev.filter((s) => s.skillId !== skillId));
        try {
            await fetch(`${SERVER_URL}/skills/${skillId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
        } catch {
            // Rollback if API fails
            setSkills(initialSkills);
        }
    };

    return (
        <div className="p-6 lg:p-8" style={{ fontFamily: SFT }}>
            <SkillHeader onAdd={() => setShowAddModal(true)} />
            <SkillStats skills={skills} />
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
                    onCreated={handleCreated}
                />
            )}

            {editingSkill && (
                <EditSkillModal
                    skill={editingSkill}
                    existingCategories={categories}
                    onClose={() => setEditingSkill(null)}
                    onUpdated={handleUpdated}
                />
            )}
        </div>
    );
}
