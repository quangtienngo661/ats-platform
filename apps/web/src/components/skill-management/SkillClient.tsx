'use client';

import { useMemo, useRef, useState } from 'react';
import { SearchX, Zap } from 'lucide-react';
import { Button, EmptyState, Surface } from '@/components/ui';
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
    const searchRef = useRef<HTMLInputElement>(null);

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

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('');
        // The clear button disappears with the no-match state; keep focus in the toolbar.
        searchRef.current?.focus();
    };

    const handleDelete = async (skillId: string) => {
        const result = await deleteSkillAction(skillId);
        if (result.success) {
            toast.success('Thành công', result.message);
        } else {
            toast.error('Lỗi', result.message);
        }
    };

    return (
        <div className="space-y-4 p-4 lg:p-6">
            <SkillHeader onAdd={() => setShowAddModal(true)}>
                <SkillFilterBar
                    categories={categories}
                    search={searchQuery}
                    category={selectedCategory}
                    onSearch={setSearchQuery}
                    onCategoryChange={setSelectedCategory}
                    searchRef={searchRef}
                />
            </SkillHeader>
            <SkillStats skills={filtered} />

            {skills.length === 0 ? (
                <Surface>
                    <EmptyState
                        icon={Zap}
                        title="Chưa có kỹ năng"
                        description="Kỹ năng bạn tạo sẽ hiện ở đây."
                        action={<Button onClick={() => setShowAddModal(true)}>Thêm kỹ năng đầu tiên</Button>}
                    />
                </Surface>
            ) : filtered.length === 0 ? (
                <Surface>
                    <EmptyState
                        icon={SearchX}
                        title="Không có kỹ năng khớp"
                        description={selectedCategory ? 'Đổi từ khóa tìm kiếm hoặc bộ lọc.' : 'Đổi từ khóa tìm kiếm.'}
                        action={
                            <Button variant="secondary" onClick={clearFilters}>
                                {selectedCategory ? 'Xóa bộ lọc' : 'Xóa tìm kiếm'}
                            </Button>
                        }
                    />
                </Surface>
            ) : (
                <SkillTable skills={filtered} onEdit={setEditingSkill} onDelete={handleDelete} />
            )}

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
