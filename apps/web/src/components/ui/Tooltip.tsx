'use client';

import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ComponentProps, ReactNode } from 'react';

export function TooltipProvider(props: ComponentProps<typeof RadixTooltip.Provider>) {
    return <RadixTooltip.Provider delayDuration={300} {...props} />;
}

export type TooltipProps = {
    content: ReactNode;
    children: ReactNode;
    side?: 'top' | 'right' | 'bottom' | 'left';
};

/** Opens on hover and keyboard focus. The child must be a single focusable element. */
export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
    return (
        <RadixTooltip.Root>
            <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
            <RadixTooltip.Portal>
                <RadixTooltip.Content
                    side={side}
                    sideOffset={6}
                    className="z-popover origin-[--radix-tooltip-content-transform-origin] rounded-ctl bg-ink px-2 py-1 text-caption text-surface shadow-e4 data-[state=delayed-open]:animate-pop-in data-[state=instant-open]:animate-pop-in data-[state=closed]:animate-pop-out"
                >
                    {content}
                </RadixTooltip.Content>
            </RadixTooltip.Portal>
        </RadixTooltip.Root>
    );
}
