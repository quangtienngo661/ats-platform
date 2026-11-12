import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from './cn';

export type CheckboxProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'> & {
    /** Sets `aria-invalid` and the error outline. */
    invalid?: boolean;
};

/**
 * A native checkbox (keyboard, form and label behaviour stay native) drawn as a 16 px box with a custom check.
 * The real input is transparent and 24 px, so the hit area meets 24×24 without changing the layout box.
 * `className` goes on the wrapper; label it with `<label htmlFor>` or `aria-label`.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
    { invalid, className, 'aria-invalid': ariaInvalid, ...props },
    ref,
) {
    return (
        <span className={cn('relative inline-grid size-4 shrink-0 place-items-center align-middle', className)}>
            <input
                ref={ref}
                type="checkbox"
                aria-invalid={invalid || ariaInvalid || undefined}
                className="peer absolute -inset-1 m-0 cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
                {...props}
            />
            <span
                aria-hidden="true"
                className={cn(
                    'pointer-events-none col-start-1 row-start-1 size-4 rounded border border-line-strong bg-surface',
                    'transition duration-press ease-out-expo peer-[:not(:checked):hover]:border-ink-3',
                    'peer-checked:border-ink peer-checked:bg-ink peer-aria-[invalid=true]:border-danger',
                    'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
                    'peer-focus-visible:outline-accent peer-disabled:opacity-50',
                )}
            />
            <svg
                aria-hidden="true"
                viewBox="0 0 12 12"
                fill="none"
                className={cn(
                    'pointer-events-none col-start-1 row-start-1 size-3 scale-75 text-surface opacity-0',
                    'transition duration-press ease-out-expo peer-checked:scale-100 peer-checked:opacity-100',
                )}
            >
                <path
                    d="M2.5 6.25 4.75 8.5 9.5 3.5"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    );
});
