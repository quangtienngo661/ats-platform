import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setUiVariantAction } from '@/servers/ui/ui-variant.action';
import { CommandPalette } from './CommandPalette';

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/servers/ui/ui-variant.action', () => ({ setUiVariantAction: vi.fn(async () => undefined) }));

// jsdom has no scrollIntoView.
const scrollIntoView = vi.fn();

beforeEach(() => {
    scrollIntoView.mockClear();
    Element.prototype.scrollIntoView = scrollIntoView;
    router.push.mockClear();
    router.refresh.mockClear();
    vi.mocked(setUiVariantAction).mockClear();
});

async function openPalette(role = 'recruiter') {
    const user = userEvent.setup();
    render(<CommandPalette userRole={role} />);
    await user.keyboard('{Control>}k{/Control}');
    const dialog = await screen.findByRole('dialog', { name: 'Tìm hoặc đi tới' });
    return { user, dialog };
}

describe('CommandPalette', () => {
    it('opens on Ctrl+K with the combobox focused', async () => {
        await openPalette();
        expect(screen.getByRole('combobox')).toHaveFocus();
    });

    it('opens from the trigger button', async () => {
        const user = userEvent.setup();
        render(<CommandPalette userRole="recruiter" />);
        // Tailwind is absent in jsdom, so the wide and the narrow trigger are both present.
        await user.click(screen.getAllByRole('button', { name: /Tìm hoặc đi tới/ })[0]);
        expect(await screen.findByRole('dialog', { name: 'Tìm hoặc đi tới' })).toBeInTheDocument();
    });

    it('filters while typing and navigates on Enter', async () => {
        const { user } = await openPalette();
        await user.keyboard('lich');
        expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Lịch phỏng vấn']);
        await user.keyboard('{Enter}');
        expect(router.push).toHaveBeenCalledWith('/interviews');
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('closes on Escape', async () => {
        const { user } = await openPalette();
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('moves the active option with the arrows and wraps', async () => {
        const { user } = await openPalette();
        const input = screen.getByRole('combobox');
        const options = screen.getAllByRole('option');
        expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
        expect(options[0]).toHaveAttribute('aria-selected', 'true');
        await user.keyboard('{ArrowDown}');
        expect(input).toHaveAttribute('aria-activedescendant', options[1].id);
        await user.keyboard('{ArrowUp}{ArrowUp}');
        expect(input).toHaveAttribute('aria-activedescendant', options[options.length - 1].id);
        await user.keyboard('{ArrowDown}');
        expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
    });

    it('says so when nothing matches, and Enter does nothing', async () => {
        const { user } = await openPalette();
        await user.keyboard('xyz{Enter}');
        expect(screen.getByRole('status')).toHaveTextContent('Không tìm thấy kết quả.');
        expect(screen.queryAllByRole('option')).toHaveLength(0);
        expect(router.push).not.toHaveBeenCalled();
    });

    it('switches to the legacy UI from its command', async () => {
        const { user } = await openPalette();
        await user.keyboard('giao dien cu{Enter}');
        await waitFor(() => expect(setUiVariantAction).toHaveBeenCalledWith('legacy'));
        expect(router.push).not.toHaveBeenCalled();
    });

    it('runs a command on click', async () => {
        const { user } = await openPalette();
        await user.click(screen.getByRole('option', { name: 'Tin tuyển dụng' }));
        expect(router.push).toHaveBeenCalledWith('/jobs');
    });

    it('resets the query and the list when the hotkey closes it', async () => {
        const { user } = await openPalette();
        await user.keyboard('lich');
        await user.keyboard('{Control>}k{/Control}');
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        await user.keyboard('{Control>}k{/Control}');
        expect(await screen.findByRole('combobox')).toHaveValue('');
        expect(screen.getAllByRole('option').length).toBeGreaterThan(1);
    });

    it('scrolls the active option into view', async () => {
        const spy = scrollIntoView;
        const { user } = await openPalette();
        spy.mockClear();
        await user.keyboard('{ArrowDown}');
        const id = screen.getByRole('combobox').getAttribute('aria-activedescendant');
        expect(id).toBeTruthy();
        expect(spy).toHaveBeenCalledWith({ block: 'nearest' });
        expect(spy.mock.contexts.at(-1)).toBe(document.getElementById(id as string));
    });

    it('ignores Enter during an IME composition', async () => {
        await openPalette();
        fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter', isComposing: true });
        expect(router.push).not.toHaveBeenCalled();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
});
