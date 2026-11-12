import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './DropdownMenu';
import { Segmented } from './Segmented';
import { Sheet } from './Sheet';
import { Tabs } from './Tabs';
import { Tooltip, TooltipProvider } from './Tooltip';

function SheetHarness() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button onClick={() => setOpen(true)}>Mở</button>
            <Sheet open={open} onOpenChange={setOpen} title="Hồ sơ ứng viên">
                <p>Nội dung</p>
            </Sheet>
        </>
    );
}

describe('Sheet', () => {
    it('opens as a named dialog, closes on Esc and returns focus to the opener', async () => {
        const user = userEvent.setup();
        render(<SheetHarness />);
        const opener = screen.getByRole('button', { name: 'Mở' });
        await user.click(opener);
        expect(screen.getByRole('dialog', { name: 'Hồ sơ ứng viên' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Đóng' })).toBeInTheDocument();
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(opener).toHaveFocus();
    });

    it('closes from the Đóng button', async () => {
        const user = userEvent.setup();
        render(<SheetHarness />);
        await user.click(screen.getByRole('button', { name: 'Mở' }));
        await user.click(screen.getByRole('button', { name: 'Đóng' }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});

describe('Dialog', () => {
    it('renders title, description, body and footer, and closes on Esc', async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();
        render(
            <Dialog
                open
                onOpenChange={onOpenChange}
                title="Xóa việc làm"
                description="Không hoàn tác được."
                footer={<button>Xác nhận</button>}
            >
                <p>Nội dung</p>
            </Dialog>,
        );
        const dialog = screen.getByRole('dialog', { name: 'Xóa việc làm' });
        expect(dialog).toHaveAccessibleDescription('Không hoàn tác được.');
        expect(screen.getByRole('button', { name: 'Xác nhận' })).toBeInTheDocument();
        await user.keyboard('{Escape}');
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});

describe('DropdownMenu', () => {
    it('opens from the keyboard, moves with arrows and closes on Esc', async () => {
        const user = userEvent.setup();
        render(
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button>Thao tác</button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Sửa</DropdownMenuItem>
                    <DropdownMenuItem destructive>Xóa</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>,
        );
        const trigger = screen.getByRole('button', { name: 'Thao tác' });
        trigger.focus();
        await user.keyboard('{Enter}');
        const edit = await screen.findByRole('menuitem', { name: 'Sửa' });
        const del = screen.getByRole('menuitem', { name: 'Xóa' });
        expect(edit).toBeInTheDocument();
        await user.keyboard('{ArrowDown}');
        expect(del).toHaveFocus();
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
    });
});

describe('Tooltip', () => {
    it('shows its content when the trigger receives keyboard focus', async () => {
        const user = userEvent.setup();
        render(
            <TooltipProvider>
                <Tooltip content="Sao chép liên kết">
                    <button>Sao chép</button>
                </Tooltip>
            </TooltipProvider>,
        );
        await user.tab();
        expect(await screen.findByRole('tooltip')).toHaveTextContent('Sao chép liên kết');
    });
});

const TABS = [
    { value: 'a', label: 'Tổng quan', content: <p>Panel A</p> },
    { value: 'b', label: 'Hồ sơ', content: <p>Panel B</p> },
    { value: 'c', label: 'Lịch sử', content: <p>Panel C</p> },
];

describe('Tabs', () => {
    it('follows the ARIA tab pattern with arrow, Home and End keys', async () => {
        const user = userEvent.setup();
        render(<Tabs tabs={TABS} />);
        const [t1, t2, t3] = screen.getAllByRole('tab');
        expect(screen.getByRole('tablist')).toBeInTheDocument();
        expect(t1).toHaveAttribute('aria-selected', 'true');
        expect(t1).toHaveAttribute('tabindex', '0');
        expect(t2).toHaveAttribute('tabindex', '-1');
        expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Tổng quan');
        t1.focus();
        await user.keyboard('{ArrowRight}');
        expect(t2).toHaveAttribute('aria-selected', 'true');
        expect(t2).toHaveFocus();
        expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel B');
        await user.keyboard('{End}');
        expect(t3).toHaveAttribute('aria-selected', 'true');
        await user.keyboard('{ArrowRight}');
        expect(t1).toHaveAttribute('aria-selected', 'true');
        await user.keyboard('{ArrowLeft}');
        expect(t3).toHaveAttribute('aria-selected', 'true');
        await user.keyboard('{Home}');
        expect(t1).toHaveAttribute('aria-selected', 'true');
    });

    it('is controllable', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<Tabs tabs={TABS} value="a" onValueChange={onValueChange} />);
        await user.click(screen.getByRole('tab', { name: 'Hồ sơ' }));
        expect(onValueChange).toHaveBeenCalledWith('b');
        expect(screen.getByRole('tab', { name: 'Tổng quan' })).toHaveAttribute('aria-selected', 'true');
    });
});

describe('Segmented', () => {
    const options = [
        { value: 'list', label: 'Danh sách' },
        { value: 'kanban', label: 'Kanban' },
    ];

    it('is a named radiogroup and reports the clicked option', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<Segmented options={options} value="list" onValueChange={onValueChange} label="Kiểu xem" />);
        expect(screen.getByRole('radiogroup', { name: 'Kiểu xem' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Danh sách' })).toHaveAttribute('aria-checked', 'true');
        await user.click(screen.getByRole('radio', { name: 'Kanban' }));
        expect(onValueChange).toHaveBeenCalledWith('kanban');
    });

    it('moves and selects with arrow keys', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        render(<Segmented options={options} value="list" onValueChange={onValueChange} label="Kiểu xem" />);
        screen.getByRole('radio', { name: 'Danh sách' }).focus();
        await user.keyboard('{ArrowRight}');
        expect(onValueChange).toHaveBeenCalledWith('kanban');
    });
});
