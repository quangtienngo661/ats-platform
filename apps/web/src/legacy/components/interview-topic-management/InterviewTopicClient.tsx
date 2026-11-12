'use client';

import { useMemo, useState } from 'react';
import { SFT } from '@/types/fonts/fonts';
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

    const filteredTopics = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return topics.filter((topic) => {
            const categoryName = getTopicCategoryName(topic);
            const matchSearch = !q || topic.name.toLowerCase().includes(q) || categoryName.toLowerCase().includes(q);
            const matchCategory = !selectedCategoryId || topic.categoryId === selectedCategoryId;
            return matchSearch && matchCategory;
        });
    }, [topics, searchQuery, selectedCategoryId]);

    return (
        <div className="p-6 lg:p-8" style={{ fontFamily: SFT }}>
            <InterviewTopicHeader onAdd={() => setShowCreateModal(true)} />
            <InterviewTopicStats topics={topics} />
            <InterviewTopicFilterBar
                categories={jobCategories}
                onSearch={setSearchQuery}
                onCategoryChange={setSelectedCategoryId}
            />
            <InterviewTopicTable
                topics={filteredTopics}
                onEdit={setEditingTopic}
            />

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