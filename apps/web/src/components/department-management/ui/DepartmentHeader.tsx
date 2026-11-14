import type { Ref } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button, Input, PageToolbar } from '@/components/ui';

interface DepartmentHeaderProps {
    onAdd: () => void;
    search: string;
    onSearchChange: (value: string) => void;
    /** Lets the list put focus back in the search field after clearing it. */
    searchRef?: Ref<HTMLInputElement>;
}

export function DepartmentHeader({ onAdd, search, onSearchChange, searchRef }: DepartmentHeaderProps) {
    return (
        <PageToolbar title="Quản lý phòng ban">
            <div className="relative w-full sm:w-64">
                <Search
                    aria-hidden="true"
                    strokeWidth={1.75}
                    className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
                />
                <Input
                    ref={searchRef}
                    aria-label="Tìm phòng ban"
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Tìm theo tên, mô tả…"
                    className="pl-8"
                />
            </div>
            <Button onClick={onAdd}>
                <Plus aria-hidden="true" strokeWidth={1.75} />
                Thêm phòng ban
            </Button>
        </PageToolbar>
    );
}
