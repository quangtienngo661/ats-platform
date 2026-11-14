import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Sheet } from '@/components/ui';

function Harness() {
    const [open, setOpen] = useState(true);
    return (
        <Sheet open={open} onOpenChange={setOpen} title="Hồ sơ ứng viên">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button>Thao tác</button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Sửa</DropdownMenuItem>
                    <DropdownMenuItem>Xóa</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </Sheet>
    );
}

describe('DropdownMenu inside Sheet', () => {
    it('shares one layer and focus stack: menu takes focus, Esc closes one layer at a time, page stays clickable', async () => {
        const user = userEvent.setup();
        render(<Harness />);
        const trigger = screen.getByRole('button', { name: 'Thao tác' });
        trigger.focus();
        await user.keyboard('{Enter}');

        const edit = await screen.findByRole('menuitem', { name: 'Sửa' });
        const del = screen.getByRole('menuitem', { name: 'Xóa' });
        await waitFor(() => expect(screen.getByRole('menu').contains(document.activeElement)).toBe(true));
        const first = document.activeElement;
        await user.keyboard('{ArrowDown}');
        expect(document.activeElement).not.toBe(first);
        expect([edit, del]).toContain(document.activeElement);

        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Sửa' })).toBeNull());
        expect(screen.getByRole('dialog', { name: 'Hồ sơ ứng viên' })).toBeTruthy();
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Thao tác' })));

        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(document.body.style.pointerEvents).not.toBe('none');
    });
});
