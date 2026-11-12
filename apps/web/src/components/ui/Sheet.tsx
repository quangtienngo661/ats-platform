'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from './cn';
import { useRestoreFocus } from './restore-focus';
import { IconButton } from './IconButton';

const WIDTH = { md: 'sm:w-[420px]', lg: 'sm:w-[560px]' } as const;

export type SheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    side?: 'right';
    width?: keyof typeof WIDTH;
    children: ReactNode;
};

/** A full-height panel that slides in from the right (100% wide under 480 px). */
export function Sheet({ open, onOpenChange, title, width = 'md', children }: SheetProps) {
    const focus = useRestoreFocus();
    return (
        <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
            <RadixDialog.Portal>
                <RadixDialog.Overlay
                    className={cn(
                        'fixed inset-0 z-overlay bg-ink/40 backdrop-blur-[2px]',
                        'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
                    )}
                />
                <RadixDialog.Content
                    {...focus}
                    aria-describedby={undefined}
                    className={cn(
                        'fixed right-0 top-0 z-modal flex h-dvh w-full flex-col bg-surface shadow-e5',
                        'data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out',
                        WIDTH[width],
                    )}
                >
                    <div className="flex items-center justify-between gap-3 px-6 py-4">
                        <RadixDialog.Title className="min-w-0 truncate text-title-sm text-ink">
                            {title}
                        </RadixDialog.Title>
                        <RadixDialog.Close asChild>
                            <IconButton aria-label="Đóng">
                                <X aria-hidden="true" className="size-4" />
                            </IconButton>
                        </RadixDialog.Close>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
                </RadixDialog.Content>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    );
}
