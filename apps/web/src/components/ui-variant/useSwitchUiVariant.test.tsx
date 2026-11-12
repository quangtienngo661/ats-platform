import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setUiVariantAction } from '@/servers/ui/ui-variant.action';
import { UiVariantMenuItem } from './UiVariantMenuItem';
import { UseModernPill } from './UseModernPill';
import { useSwitchUiVariant } from './useSwitchUiVariant';

const router = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/servers/ui/ui-variant.action', () => ({ setUiVariantAction: vi.fn(async () => undefined) }));

const action = vi.mocked(setUiVariantAction);

// A queued once-implementation must not leak into the next test.
beforeEach(() => {
    action.mockReset();
    action.mockResolvedValue(undefined);
});

describe('useSwitchUiVariant', () => {
    it('saves the variant, then refreshes, and reports pending while the action runs', async () => {
        let finish!: () => void;
        action.mockImplementationOnce(() => new Promise<void>((resolve) => (finish = resolve)));
        const { result } = renderHook(() => useSwitchUiVariant());
        expect(result.current.pending).toBe(false);

        act(() => result.current.switchTo('legacy'));
        await waitFor(() => expect(result.current.pending).toBe(true));
        expect(action).toHaveBeenCalledWith('legacy');
        expect(router.refresh).not.toHaveBeenCalled();

        await act(async () => finish());
        await waitFor(() => expect(result.current.pending).toBe(false));
        expect(router.refresh).toHaveBeenCalledTimes(1);
    });
});

describe('UiVariantMenuItem', () => {
    it('switches to the legacy UI and then calls onDone', async () => {
        const onDone = vi.fn();
        render(<UiVariantMenuItem onDone={onDone} />);
        await userEvent.setup().click(screen.getByRole('button', { name: 'Dùng giao diện cũ' }));
        await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
        expect(action).toHaveBeenCalledWith('legacy');
        expect(router.refresh).toHaveBeenCalledTimes(1);
    });
});

describe('UseModernPill', () => {
    it('switches to the modern UI and refreshes', async () => {
        render(<UseModernPill />);
        await userEvent.setup().click(screen.getByRole('button', { name: 'Dùng giao diện mới' }));
        await waitFor(() => expect(router.refresh).toHaveBeenCalledTimes(1));
        expect(action).toHaveBeenCalledWith('modern');
    });
});
