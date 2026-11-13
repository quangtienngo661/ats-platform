import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Button, PageToolbar } from '@/components/ui';

interface InterviewTopicHeaderProps {
    onAdd: () => void;
    /** Search and filters, placed before the add button. */
    children?: ReactNode;
}

export function InterviewTopicHeader({ onAdd, children }: InterviewTopicHeaderProps) {
    return (
        <PageToolbar title="Chủ đề phỏng vấn">
            {children}
            <Button onClick={onAdd}>
                <Plus aria-hidden="true" strokeWidth={1.75} />
                Thêm chủ đề
            </Button>
        </PageToolbar>
    );
}
