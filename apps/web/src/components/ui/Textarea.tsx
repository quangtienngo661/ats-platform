import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from './cn';
import { controlClasses } from './Input';

export type TextareaProps = ComponentPropsWithoutRef<'textarea'> & {
    /** Sets `aria-invalid` and the error outline. */
    invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    { invalid, className, 'aria-invalid': ariaInvalid, ...props },
    ref,
) {
    return (
        <textarea
            ref={ref}
            aria-invalid={invalid || ariaInvalid || undefined}
            className={cn(controlClasses, 'min-h-20 resize-y px-3 py-2', className)}
            {...props}
        />
    );
});
