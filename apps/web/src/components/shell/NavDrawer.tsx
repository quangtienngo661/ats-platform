'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { IconButton } from '@/components/ui';
import { useRestoreFocus } from '@/components/ui/restore-focus';

/**
 * The staff navigation as a modal drawer from the left, under 1024 px. `Sheet` only slides from the right, so
 * this is the same Radix dialog with mirrored keyframes (`sheet-left-in/out`).
 */
export function NavDrawer({
    open,
    onOpenChange,
    title,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: ReactNode;
}) {
    const focus = useRestoreFocus();
    return (
        <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
            <RadixDialog.Portal>
                <RadixDialog.Overlay className="fixed inset-0 z-overlay bg-ink/40 backdrop-blur-[2px] data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
                <RadixDialog.Content
                    {...focus}
                    aria-describedby={undefined}
                    className="fixed inset-y-0 left-0 z-modal flex h-dvh w-[min(280px,85vw)] flex-col bg-surface shadow-e5 data-[state=open]:animate-sheet-left-in data-[state=closed]:animate-sheet-left-out"
                >
                    <RadixDialog.Title className="sr-only">{title}</RadixDialog.Title>
                    {children}
                </RadixDialog.Content>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    );
}

/** The drawer's close button; must render inside `NavDrawer`. */
export function NavDrawerClose() {
    return (
        <RadixDialog.Close asChild>
            <IconButton aria-label="Đóng" className="-mr-2">
                <X aria-hidden="true" strokeWidth={1.75} />
            </IconButton>
        </RadixDialog.Close>
    );
}
