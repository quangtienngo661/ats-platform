'use client';

import { useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import type { UiVariant } from '@/lib/ui-variant';
import { setUiVariantAction } from '@/servers/ui/ui-variant.action';

/**
 * Saves the UI variant cookie, then refreshes so the server renders the other variant. `pending` stays true
 * until the refresh has been requested, so a menu item or pill can show it is busy.
 */
export function useSwitchUiVariant() {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const switchTo = useCallback(
        (variant: UiVariant, onDone?: () => void) => {
            startTransition(async () => {
                try {
                    await setUiVariantAction(variant);
                } catch {
                    // A failed switch must not reach error.tsx; the page the user is on is still fine.
                    toast.error('Không đổi được giao diện. Thử lại.');
                    return;
                }
                router.refresh();
                onDone?.();
            });
        },
        [router],
    );

    return { switchTo, pending };
}
