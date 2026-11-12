import { LoaderCircle } from 'lucide-react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
    'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-ctl font-medium ' +
    'transition duration-press ease-out-expo active:scale-[.97] disabled:pointer-events-none [&_svg]:shrink-0';

const variants: Record<ButtonVariant, string> = {
    primary: 'bg-ink text-surface hover:bg-ink/90',
    secondary: 'bg-surface text-ink shadow-e2 hover:bg-surface-2 data-[state=open]:bg-surface-2',
    ghost: 'text-ink-2 hover:bg-ink/5 hover:text-ink data-[state=open]:bg-ink/5 data-[state=open]:text-ink',
    // Hover darkens: a lighter red or blue would drop white text below 4.5:1.
    danger: 'bg-danger-solid text-surface hover:bg-danger',
    accent: 'bg-accent text-surface hover:bg-accent-text',
};

const sizes: Record<ButtonSize, string> = {
    sm: 'h-8 gap-1.5 px-3 text-body-sm [&_svg]:size-4',
    md: 'h-9 gap-2 px-3.5 text-body-sm [&_svg]:size-4',
    lg: 'h-11 gap-2 px-5 text-body [&_svg]:size-[18px]',
};

/** Disabled look, applied only when the button is disabled and not loading (loading keeps its variant). */
const disabledLook: Record<ButtonVariant, string> = {
    primary: 'disabled:bg-surface-2 disabled:text-ink-4 disabled:shadow-e1',
    secondary: 'disabled:bg-surface-2 disabled:text-ink-4 disabled:shadow-e1',
    ghost: 'disabled:bg-transparent disabled:text-ink-4',
    danger: 'disabled:bg-surface-2 disabled:text-ink-4 disabled:shadow-e1',
    accent: 'disabled:bg-surface-2 disabled:text-ink-4 disabled:shadow-e1',
};

/** Classes shared by `Button` and `ButtonLink`, so a link styled as a button never drifts from a real one. */
export function buttonClasses({
    variant = 'primary',
    size = 'md',
    className,
}: {
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
} = {}): string {
    return cn(base, variants[variant], sizes[size], className);
}

export type IconButtonSize = 'sm' | 'md';

/** Square sizes for an icon-only button: 32 / 36 px, icon 16 / 18 px. */
const iconSizes: Record<IconButtonSize, string> = {
    sm: 'size-8 [&_svg]:size-4',
    md: 'size-9 [&_svg]:size-[18px]',
};

/** Classes for `IconButton`: the ghost variant from the same builder, on a square. */
export function iconButtonClasses({
    size = 'md',
    className,
}: {
    size?: IconButtonSize;
    className?: string;
} = {}): string {
    return cn(base, variants.ghost, disabledLook.ghost, iconSizes[size], className);
}

export type ButtonProps = ComponentPropsWithoutRef<'button'> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Shows a spinner before the label, sets `aria-busy` and disables the button. */
    loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant = 'primary', size = 'md', loading = false, disabled, type = 'button', className, children, ...props },
    ref,
) {
    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={buttonClasses({
                variant,
                size,
                className: cn(!loading && disabledLook[variant], className),
            })}
            {...props}
        >
            {loading ? <LoaderCircle aria-hidden="true" strokeWidth={1.75} className="animate-spin" /> : null}
            {children}
        </button>
    );
});
