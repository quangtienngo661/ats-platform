import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DropdownMenuItem, RowActionsItem, RowActionsMenu } from '@/components/ui';

type User = ReturnType<typeof userEvent.setup>;

/** A row like the admin lists: a named row with the menu, and a field an action may move focus to. */
function Row({ onEdit, onDelete, onRename }: { onEdit: () => void; onDelete: () => void; onRename: (field: HTMLInputElement) => void }) {
    const field = useRef<HTMLInputElement>(null);
    return (
        <div className="group">
            <p id="row-name">Kỹ thuật</p>
            <input ref={field} aria-label="Tên mới" />
            <RowActionsMenu describedBy="row-name">
                <RowActionsItem afterClose={onEdit}>Chỉnh sửa</RowActionsItem>
                <RowActionsItem movesFocus afterClose={() => onRename(field.current as HTMLInputElement)}>
                    Đổi tên
                </RowActionsItem>
                <DropdownMenuItem destructive onSelect={onDelete}>
                    Xóa
                </DropdownMenuItem>
            </RowActionsMenu>
        </div>
    );
}

function renderRow() {
    const onEdit = vi.fn<() => void>();
    const onDelete = vi.fn<() => void>();
    const onRename = vi.fn<(field: HTMLInputElement) => void>((field) => field.focus());
    render(<Row onEdit={onEdit} onDelete={onDelete} onRename={onRename} />);
    return { onEdit, onDelete, onRename, trigger: screen.getByRole('button', { name: 'Tùy chọn' }) };
}

/** Opens the menu from the keyboard and moves to `item` (bounded, so a missing item fails instead of looping). */
async function openAt(user: User, trigger: HTMLElement, item: string) {
    trigger.focus();
    await user.keyboard('{Enter}');
    const target = await screen.findByRole('menuitem', { name: item });
    for (let i = 0; i < 5 && document.activeElement !== target; i++) await user.keyboard('{ArrowDown}');
    expect(target).toHaveFocus();
}

describe('RowActionsMenu', () => {
    it('is a "Tùy chọn" button described by the row name that opens the caller’s items', async () => {
        const user = userEvent.setup();
        const { trigger } = renderRow();
        expect(trigger).toHaveAccessibleDescription('Kỹ thuật');
        expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

        trigger.focus();
        await user.keyboard('{Enter}');

        const names = (await screen.findAllByRole('menuitem')).map((item) => item.textContent);
        expect(names).toEqual(['Chỉnh sửa', 'Đổi tên', 'Xóa']);
    });

    it('runs an item’s action only after the menu has closed, with focus already back on the trigger', async () => {
        const user = userEvent.setup();
        const { trigger, onEdit, onDelete } = renderRow();
        let menuOpenAtEdit: boolean | null = null;
        let focusAtEdit: Element | null = null;
        onEdit.mockImplementation(() => {
            menuOpenAtEdit = screen.queryByRole('menu') !== null;
            focusAtEdit = document.activeElement;
        });

        await openAt(user, trigger, 'Chỉnh sửa');
        await user.keyboard('{Enter}');

        await waitFor(() => expect(onEdit).toHaveBeenCalledTimes(1));
        expect(menuOpenAtEdit).toBe(false);
        expect(focusAtEdit).toBe(trigger);
        expect(trigger).toHaveFocus();
        expect(onDelete).not.toHaveBeenCalled();
    });

    it('returns focus to the trigger after Esc and after a plain item', async () => {
        const user = userEvent.setup();
        const { trigger, onDelete } = renderRow();

        trigger.focus();
        await user.keyboard('{Enter}');
        await screen.findByRole('menu');
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
        await waitFor(() => expect(trigger).toHaveFocus());

        await openAt(user, trigger, 'Xóa');
        await user.keyboard('{Enter}');
        expect(onDelete).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
        await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('leaves focus where a "movesFocus" action put it instead of pulling it back to the trigger', async () => {
        const user = userEvent.setup();
        const { trigger, onRename } = renderRow();
        let focusAtRename: Element | null = null;
        onRename.mockImplementation((field) => {
            focusAtRename = document.activeElement;
            field.focus();
        });

        await openAt(user, trigger, 'Đổi tên');
        await user.keyboard('{Enter}');

        await waitFor(() => expect(onRename).toHaveBeenCalledTimes(1));
        const field = screen.getByRole('textbox', { name: 'Tên mới' });
        // The trigger never took focus on the way: the action is the one that places it.
        expect(focusAtRename).not.toBe(trigger);
        expect(field).toHaveFocus();
        // Still there once every pending close/focus task has run.
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(field).toHaveFocus();
        expect(screen.queryByRole('menu')).toBeNull();
    });

    it('forwards its ref to the trigger, so a caller can focus it later', () => {
        const ref = createRef<HTMLButtonElement>();
        render(
            <RowActionsMenu ref={ref}>
                <RowActionsItem afterClose={vi.fn()}>Chỉnh sửa</RowActionsItem>
            </RowActionsMenu>,
        );
        expect(ref.current).toBe(screen.getByRole('button', { name: 'Tùy chọn' }));
    });
});
