import { useRef } from 'react';

/**
 * Radix Dialog only returns focus to a `Dialog.Trigger`. Our overlays are controlled by an
 * `open` prop with the opener elsewhere, so remember the focused element as the overlay opens
 * and refocus it as it closes.
 */
export function useRestoreFocus() {
    const opener = useRef<HTMLElement | null>(null);
    return {
        onOpenAutoFocus() {
            opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        },
        onCloseAutoFocus(e: Event) {
            if (opener.current?.isConnected) {
                e.preventDefault();
                opener.current.focus();
            }
            opener.current = null;
        },
    };
}
