import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from './cn';

export type ControlSize = 'sm' | 'md' | 'lg';

/**
 * What a control takes from `Field` beyond the native `id` and `required`, so `<Input {...f} />` is the whole
 * wiring. An explicit `aria-describedby` wins over `describedBy`.
 */
export type ControlFieldProps = {
    /** Sets `aria-invalid` and the error outline. */
    invalid?: boolean;
    /** Space-separated ids of the error and hint; rendered as `aria-describedby`. */
    describedBy?: string;
};

/** Shared by `Input`, `Textarea` and `Select`. Focus uses the global `:focus-visible` outline. */
export const controlClasses =
    'w-full min-w-0 rounded-ctl border border-line-strong bg-surface text-ink ' +
    'transition duration-hover ease-out-expo placeholder:text-ink-3 hover:border-ink-3 ' +
    'aria-[invalid=true]:border-danger ' +
    'disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-2 disabled:text-ink-4';

/** Heights per size (the spec's control heights: 32 / 36 / 44 px). */
export const controlHeights: Record<ControlSize, string> = { sm: 'h-8', md: 'h-9', lg: 'h-11' };

/**
 * Text per size: 16 px below `sm` so iOS Safari does not zoom the page when the control takes focus,
 * then 13 px (`text-body-sm`) for sm and md, 15 px (`text-body`) for lg.
 */
export const controlText: Record<ControlSize, string> = {
    sm: 'text-base sm:text-body-sm',
    md: 'text-base sm:text-body-sm',
    lg: 'text-base sm:text-body',
};

// `size` is the native character-width attribute on <input>; ours is the control size.
export type InputProps = Omit<ComponentPropsWithoutRef<'input'>, 'size'> &
    ControlFieldProps & {
        size?: ControlSize;
    };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { invalid, describedBy, size = 'md', className, 'aria-invalid': ariaInvalid, 'aria-describedby': ariaDescribedBy, ...props },
    ref,
) {
    return (
        <input
            ref={ref}
            aria-invalid={invalid || ariaInvalid || undefined}
            aria-describedby={ariaDescribedBy ?? describedBy}
            className={cn(controlClasses, controlHeights[size], controlText[size], 'px-3', className)}
            {...props}
        />
    );
});
