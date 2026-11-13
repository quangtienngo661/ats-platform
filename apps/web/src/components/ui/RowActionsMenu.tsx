'use client';

import {
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useImperativeHandle,
    useRef,
    type ComponentPropsWithoutRef,
    type ElementRef,
    type ReactNode,
} from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from './cn';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './DropdownMenu';
import { IconButton } from './IconButton';

/**
 * Row controls that are always visible on touch and narrow screens; on a wide screen with hover they show on row
 * hover or focus. The row (or card) must carry `group`.
 */
export const ROW_ACTION_REVEAL =
    'group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:hover)_and_(min-width:1024px)]:opacity-0';

type PendingAction = { run: () => void; movesFocus: boolean };

const ScheduleContext = createContext<((action: PendingAction) => void) | null>(null);

export interface RowActionsMenuProps {
    /** Id of the element that names the row; the trigger is described by it ("Tùy chọn", "Kỹ thuật"). */
    describedBy?: string;
    /** Position nudges for the trigger (e.g. `-mr-1 -mt-1` in a card corner). Never a class that fights the base. */
    triggerClassName?: string;
    /** `RowActionsItem`s, plain `DropdownMenuItem`s, separators and submenus. */
    children: ReactNode;
}

/**
 * The "Tùy chọn" menu of a list row or card. Items whose action opens a dialog or changes the row run once the menu
 * has closed (`RowActionsItem`), so focus is settled before the action and a dialog returns focus to the trigger.
 * The ref reaches the trigger, for callers that move focus to it later.
 */
export const RowActionsMenu = forwardRef<HTMLButtonElement, RowActionsMenuProps>(function RowActionsMenu(
    { describedBy, triggerClassName, children },
    ref,
) {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const pending = useRef<PendingAction | null>(null);
    useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement);

    const schedule = useCallback((action: PendingAction) => {
        pending.current = action;
    }, []);

    return (
        <ScheduleContext.Provider value={schedule}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <IconButton
                        ref={triggerRef}
                        size="sm"
                        aria-label="Tùy chọn"
                        aria-describedby={describedBy}
                        className={cn(triggerClassName, ROW_ACTION_REVEAL)}
                    >
                        <MoreHorizontal aria-hidden="true" strokeWidth={1.75} />
                    </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    onCloseAutoFocus={(e) => {
                        const action = pending.current;
                        pending.current = null;
                        if (!action) return;
                        e.preventDefault();
                        if (!action.movesFocus) triggerRef.current?.focus();
                        action.run();
                    }}
                >
                    {children}
                </DropdownMenuContent>
            </DropdownMenu>
        </ScheduleContext.Provider>
    );
});

export type RowActionsItemProps = Omit<ComponentPropsWithoutRef<typeof DropdownMenuItem>, 'onSelect'> & {
    /** Runs once the menu has closed. */
    afterClose: () => void;
    /**
     * The action places focus itself (e.g. on the "Hủy" of an inline confirmation), so focus is not returned to the
     * trigger first. Without it, the trigger has focus when the action runs.
     */
    movesFocus?: boolean;
};

/** A menu item of `RowActionsMenu` whose action runs after the menu has closed. */
export const RowActionsItem = forwardRef<ElementRef<typeof DropdownMenuItem>, RowActionsItemProps>(
    function RowActionsItem({ afterClose, movesFocus = false, ...props }, ref) {
        const schedule = useContext(ScheduleContext);
        if (!schedule) throw new Error('RowActionsItem must be rendered inside RowActionsMenu');
        return <DropdownMenuItem ref={ref} onSelect={() => schedule({ run: afterClose, movesFocus })} {...props} />;
    },
);
