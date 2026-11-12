import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from './cn';

/**
 * Shared by `Input`, `Textarea` and `Select`. Text is 16 px below `sm` so iOS Safari does not zoom the page
 * when the control takes focus, and 13 px (`text-body-sm`) from `sm` up. Focus uses the global
 * `:focus-visible` outline.
 */
export const controlClasses =
    'w-full min-w-0 rounded-ctl border border-line-strong bg-surface text-base text-ink sm:text-body-sm ' +
    'transition duration-hover ease-out-expo placeholder:text-ink-3 hover:border-ink-3 ' +
    'aria-[invalid=true]:border-danger ' +
    'disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-2 disabled:text-ink-4';

export type InputProps = ComponentPropsWithoutRef<'input'> & {
    /** Sets `aria-invalid` and the error outline. */
    invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { invalid, className, 'aria-invalid': ariaInvalid, ...props },
    ref,
) {
    return (
        <input
            ref={ref}
            aria-invalid={invalid || ariaInvalid || undefined}
            className={cn(controlClasses, 'h-9 px-3', className)}
            {...props}
        />
    );
});
