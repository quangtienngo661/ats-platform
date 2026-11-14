'use client';

import * as Menu from '@radix-ui/react-dropdown-menu';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from './cn';

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuSub = Menu.Sub;

const contentClasses = cn(
    'z-popover min-w-[200px] origin-[--radix-dropdown-menu-content-transform-origin] rounded-card bg-surface p-1 shadow-e4',
    'data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out',
);

export const DropdownMenuContent = forwardRef<
    ElementRef<typeof Menu.Content>,
    ComponentPropsWithoutRef<typeof Menu.Content>
>(function DropdownMenuContent({ className, sideOffset = 6, ...props }, ref) {
    return (
        <Menu.Portal>
            <Menu.Content ref={ref} sideOffset={sideOffset} className={cn(contentClasses, className)} {...props} />
        </Menu.Portal>
    );
});

export const DropdownMenuSubContent = forwardRef<
    ElementRef<typeof Menu.SubContent>,
    ComponentPropsWithoutRef<typeof Menu.SubContent>
>(function DropdownMenuSubContent({ className, ...props }, ref) {
    return (
        <Menu.Portal>
            <Menu.SubContent ref={ref} className={cn(contentClasses, className)} {...props} />
        </Menu.Portal>
    );
});

/** No text colour here: `cn` does not merge, so an item gets exactly one of `text-ink` / `text-danger`. */
const itemBase =
    'flex h-8 cursor-default select-none items-center gap-2 rounded-ctl px-2 text-body-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:text-ink-4 data-[highlighted]:bg-surface-2';
const itemClasses = `${itemBase} text-ink`;

export const DropdownMenuItem = forwardRef<
    ElementRef<typeof Menu.Item>,
    ComponentPropsWithoutRef<typeof Menu.Item> & { destructive?: boolean }
>(function DropdownMenuItem({ className, destructive, ...props }, ref) {
    return <Menu.Item ref={ref} className={cn(itemBase, destructive ? 'text-danger' : 'text-ink', className)} {...props} />;
});

export const DropdownMenuSubTrigger = forwardRef<
    ElementRef<typeof Menu.SubTrigger>,
    ComponentPropsWithoutRef<typeof Menu.SubTrigger>
>(function DropdownMenuSubTrigger({ className, ...props }, ref) {
    return (
        <Menu.SubTrigger
            ref={ref}
            className={cn(itemClasses, 'justify-between data-[state=open]:bg-surface-2', className)}
            {...props}
        />
    );
});

export const DropdownMenuSeparator = forwardRef<
    ElementRef<typeof Menu.Separator>,
    ComponentPropsWithoutRef<typeof Menu.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
    return <Menu.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-line', className)} {...props} />;
});
