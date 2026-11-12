import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { logoutAction } from '@/servers/auth/auth.action';
import { setUiVariantAction } from '@/servers/ui/ui-variant.action';
import { AccountMenu } from './AccountMenu';

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/servers/auth/auth.action', () => ({ logoutAction: vi.fn(async () => undefined) }));
vi.mock('@/servers/ui/ui-variant.action', () => ({ setUiVariantAction: vi.fn(async () => undefined) }));

async function openMenu(name: RegExp | string = /Nguyễn Thị Lan/) {
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name });
    trigger.focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('menu');
    return { user, trigger };
}

describe('AccountMenu', () => {
    it('offers the profile, the legacy UI and sign-out, in that order', async () => {
        render(<AccountMenu name="Nguyễn Thị Lan" email="lan@acme.vn" profileHref="/my-profile" logoutRedirect="/sign-in/admin" />);
        await openMenu();
        expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
            'Hồ sơ của tôi',
            'Dùng giao diện cũ',
            'Đăng xuất',
        ]);
        expect(screen.getByRole('menuitem', { name: 'Hồ sơ của tôi' })).toHaveAttribute('href', '/my-profile');
        expect(screen.getByRole('menu')).toHaveTextContent('lan@acme.vn');
    });

    it('takes a caller label for the profile item', async () => {
        render(
            <AccountMenu name="Nguyễn Thị Lan" profileHref="/profile" profileLabel="Hồ sơ" logoutRedirect="/sign-in" />,
        );
        await openMenu();
        expect(screen.getByRole('menuitem', { name: 'Hồ sơ' })).toHaveAttribute('href', '/profile');
    });

    it('runs the caller hook first, then signs out to the given page', async () => {
        const onBeforeLogout = vi.fn();
        render(
            <AccountMenu
                name="Nguyễn Thị Lan"
                profileHref="/my-profile"
                logoutRedirect="/sign-in/admin"
                onBeforeLogout={onBeforeLogout}
            />,
        );
        const { user } = await openMenu();
        await user.click(screen.getByRole('menuitem', { name: 'Đăng xuất' }));
        await waitFor(() => expect(logoutAction).toHaveBeenCalledWith('/sign-in/admin'));
        expect(logoutAction).toHaveBeenCalledTimes(1);
        expect(onBeforeLogout).toHaveBeenCalledTimes(1);
        expect(onBeforeLogout.mock.invocationCallOrder[0]).toBeLessThan(
            vi.mocked(logoutAction).mock.invocationCallOrder[0],
        );
    });

    it('switches to the legacy UI and refreshes the page', async () => {
        render(<AccountMenu name="Nguyễn Thị Lan" profileHref="/my-profile" logoutRedirect="/sign-in/admin" />);
        const { user } = await openMenu();
        await user.click(screen.getByRole('menuitem', { name: 'Dùng giao diện cũ' }));
        await waitFor(() => expect(router.refresh).toHaveBeenCalledTimes(1));
        expect(setUiVariantAction).toHaveBeenCalledWith('legacy');
        expect(vi.mocked(setUiVariantAction).mock.invocationCallOrder[0]).toBeLessThan(
            router.refresh.mock.invocationCallOrder[0],
        );
    });

    it('keeps the name as the trigger’s accessible name when only the avatar shows', async () => {
        render(
            <AccountMenu variant="header" name="Trần Minh" profileHref="/profile" logoutRedirect="/sign-in" />,
        );
        const { trigger } = await openMenu('Trần Minh');
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
});
