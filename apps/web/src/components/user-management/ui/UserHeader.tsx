import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Button, PageToolbar } from '@/components/ui';

interface UserHeaderProps {
    onAdd: () => void;
    /** Search and filters, placed before the add button. */
    children?: ReactNode;
}

export function UserHeader({ onAdd, children }: UserHeaderProps) {
    return (
        <PageToolbar title="Quản lý người dùng">
            {children}
            <Button onClick={onAdd}>
                <Plus aria-hidden="true" strokeWidth={1.75} />
                Thêm người dùng
            </Button>
        </PageToolbar>
    );
}
