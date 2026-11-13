import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Button, PageToolbar } from '@/components/ui';

interface SkillHeaderProps {
    onAdd: () => void;
    /** Search and filters, placed before the add button. */
    children?: ReactNode;
}

export function SkillHeader({ onAdd, children }: SkillHeaderProps) {
    return (
        <PageToolbar title="Quản lý kỹ năng">
            {children}
            <Button onClick={onAdd}>
                <Plus aria-hidden="true" strokeWidth={1.75} />
                Thêm kỹ năng
            </Button>
        </PageToolbar>
    );
}
