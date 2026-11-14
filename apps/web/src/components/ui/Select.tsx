import { ChevronDown } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from './cn';
import { controlClasses, controlHeights, controlText, type ControlFieldProps, type ControlSize } from './Input';

// `size` is the native visible-rows attribute on <select>; ours is the control size.
export type SelectProps = Omit<ComponentPropsWithoutRef<'select'>, 'size'> &
    ControlFieldProps & {
        size?: ControlSize;
    };

/** A styled native `<select>` (keyboard and mobile pickers stay native). `className` goes on the wrapper. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
    {
        invalid,
        describedBy,
        size = 'md',
        className,
        'aria-invalid': ariaInvalid,
        'aria-describedby': ariaDescribedBy,
        children,
        ...props
    },
    ref,
) {
    return (
        <span className={cn('relative block min-w-0', className)}>
            <select
                ref={ref}
                aria-invalid={invalid || ariaInvalid || undefined}
                aria-describedby={ariaDescribedBy ?? describedBy}
                className={cn(
                    controlClasses,
                    controlHeights[size],
                    controlText[size],
                    'cursor-pointer appearance-none truncate pl-3 pr-9',
                )}
                {...props}
            >
                {children}
            </select>
            <ChevronDown
                aria-hidden="true"
                strokeWidth={1.75}
                className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
            />
        </span>
    );
});
