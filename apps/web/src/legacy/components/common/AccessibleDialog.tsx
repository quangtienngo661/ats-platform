'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { cloneElement, useRef, type ReactElement, type ReactNode } from 'react';

export function AccessibleDialog({
    children, onClose, dismissible = true,
}: { children: ReactNode; onClose: () => void; dismissible?: boolean }) {
    return (
        <Dialog.Root open onOpenChange={(open) => { if (!open && dismissible) onClose(); }}>
            <Dialog.Portal>{children}</Dialog.Portal>
        </Dialog.Root>
    );
}

export const DialogOverlay = Dialog.Overlay;

/** asChild preserves the existing panel element, classes and motion. */
export function DialogContent({
    children, title,
}: { children: ReactElement<{ children?: ReactNode }>; title: ReactNode }) {
    const previousFocus = useRef<HTMLElement | null>(null);
    return (
        <Dialog.Content
            asChild
            aria-describedby={undefined}
            onOpenAutoFocus={() => { previousFocus.current = document.activeElement as HTMLElement | null; }}
            onCloseAutoFocus={(event) => {
                if (previousFocus.current?.isConnected) {
                    event.preventDefault();
                    previousFocus.current.focus();
                }
            }}
        >
            {cloneElement(children, {}, (
                <>
                    <Dialog.Title asChild><span className="sr-only">{title}</span></Dialog.Title>
                    {children.props.children}
                </>
            ))}
        </Dialog.Content>
    );
}
