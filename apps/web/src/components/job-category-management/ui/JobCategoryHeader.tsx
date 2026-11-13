import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Button, PageToolbar } from '@/components/ui';

interface JobCategoryHeaderProps {
    onAdd: () => void;
    /** Search, placed before the add button. */
    children?: ReactNode;
}

export function JobCategoryHeader({ onAdd, children }: JobCategoryHeaderProps) {
    return (
        <PageToolbar title="Danh mục ngành nghề">
            {children}
            <Button onClick={onAdd}>
                <Plus aria-hidden="true" strokeWidth={1.75} />
                Thêm danh mục
            </Button>
        </PageToolbar>
    );
}
