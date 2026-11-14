'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { cn } from './cn';
import { useRestoreFocus } from './restore-focus';

const SIZE = { sm: 'max-w-[400px]', md: 'max-w-[560px]', lg: 'max-w-[760px]' } as const;

export type DialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    size?: keyof typeof SIZE;
    children: ReactNode;
    footer?: ReactNode;
};

/** A centred modal. Radix supplies the focus trap, Esc and focus return; open/close animate via data-state keyframes. */
export function Dialog({ open, onOpenChange, title, description, size = 'md', children, footer }: DialogProps) {
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
                    {...(description ? {} : { 'aria-describedby': undefined })}
                    className={cn(
                        'fixed left-1/2 top-1/2 z-modal flex w-[calc(100%-32px)] flex-col',
                        'max-h-[calc(100dvh-48px)] rounded-panel bg-surface shadow-e5',
                        'data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out',
                        SIZE[size],
                    )}
                >
                    <div className="px-6 pt-6">
                        <RadixDialog.Title className="text-title-sm text-ink">{title}</RadixDialog.Title>
                        {description ? (
                            <RadixDialog.Description className="mt-1 text-body-sm text-ink-3">
                                {description}
                            </RadixDialog.Description>
                        ) : null}
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
                    {footer ? <div className="flex justify-end gap-2 px-6 pb-6">{footer}</div> : null}
                </RadixDialog.Content>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    );
}
