'use client';

import { useMemo, useRef, useState } from 'react';
import { ClipboardList, SearchX } from 'lucide-react';
import { Button, EmptyState, Surface } from '@/components/ui';
import { IInterviewTopic } from '@/types/interfaces/interview.interface';
import { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import { InterviewTopicHeader } from './ui/InterviewTopicHeader';
import { InterviewTopicStats } from './ui/InterviewTopicStats';
import { InterviewTopicTable } from './ui/InterviewTopicTable';
import { MutateInterviewTopicModal } from './ui/MutateInterviewTopicModal';
import { InterviewTopicFilterBar } from './ui/InterviewTopicFilterBar';

interface InterviewTopicClientProps {
    topics: IInterviewTopic[];
    jobCategories: IJobCategoryDto[];
}

function getTopicCategoryName(topic: IInterviewTopic) {
    return topic.category?.name ?? '';
}

export default function InterviewTopicClient({ topics, jobCategories }: InterviewTopicClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTopic, setEditingTopic] = useState<IInterviewTopic | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const filteredTopics = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return topics.filter((topic) => {
            const categoryName = getTopicCategoryName(topic);
            const matchSearch = !q || topic.name.toLowerCase().includes(q) || categoryName.toLowerCase().includes(q);
            const matchCategory = !selectedCategoryId || topic.categoryId === selectedCategoryId;
            return matchSearch && matchCategory;
        });
    }, [topics, searchQuery, selectedCategoryId]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategoryId('');
        // The clear button disappears with the no-match state; keep focus in the toolbar.
        searchRef.current?.focus();
    };

    return (
        <div className="space-y-4 p-4 lg:p-6">
            <InterviewTopicHeader onAdd={() => setShowCreateModal(true)}>
                <InterviewTopicFilterBar
                    categories={jobCategories}
                    search={searchQuery}
                    categoryId={selectedCategoryId}
                    onSearch={setSearchQuery}
                    onCategoryChange={setSelectedCategoryId}
                    searchRef={searchRef}
                />
            </InterviewTopicHeader>
            <InterviewTopicStats topics={topics} />

            {topics.length === 0 ? (
                <Surface>
                    <EmptyState
                        icon={ClipboardList}
                        title="Chưa có chủ đề"
                        description="Chủ đề phỏng vấn bạn tạo sẽ hiện ở đây."
                        action={<Button onClick={() => setShowCreateModal(true)}>Thêm chủ đề đầu tiên</Button>}
                    />
                </Surface>
            ) : filteredTopics.length === 0 ? (
                <Surface>
                    <EmptyState
                        icon={SearchX}
                        title="Không có chủ đề khớp"
                        description={selectedCategoryId ? 'Đổi từ khóa tìm kiếm hoặc bộ lọc.' : 'Đổi từ khóa tìm kiếm.'}
                        action={
                            <Button variant="secondary" onClick={clearFilters}>
                                {selectedCategoryId ? 'Xóa bộ lọc' : 'Xóa tìm kiếm'}
                            </Button>
                        }
                    />
                </Surface>
            ) : (
                <InterviewTopicTable topics={filteredTopics} onEdit={setEditingTopic} />
            )}

            {showCreateModal && (
                <MutateInterviewTopicModal
                    jobCategories={jobCategories}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {editingTopic && (
                <MutateInterviewTopicModal
                    topic={editingTopic}
                    jobCategories={jobCategories}
                    onClose={() => setEditingTopic(null)}
                />
            )}
        </div>
    );
}
