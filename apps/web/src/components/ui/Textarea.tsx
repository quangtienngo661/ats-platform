import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from './cn';
import { controlClasses, controlText, type ControlFieldProps, type ControlSize } from './Input';

/** A textarea grows with `rows` or resizing, so `size` sets only its minimum height. */
const minHeights: Record<ControlSize, string> = { sm: 'min-h-16', md: 'min-h-20', lg: 'min-h-24' };

export type TextareaProps = ComponentPropsWithoutRef<'textarea'> &
    ControlFieldProps & {
        size?: ControlSize;
    };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    { invalid, describedBy, size = 'md', className, 'aria-invalid': ariaInvalid, 'aria-describedby': ariaDescribedBy, ...props },
    ref,
) {
    return (
        <textarea
            ref={ref}
            aria-invalid={invalid || ariaInvalid || undefined}
            aria-describedby={ariaDescribedBy ?? describedBy}
            className={cn(controlClasses, minHeights[size], controlText[size], 'resize-y px-3 py-2', className)}
            {...props}
        />
    );
});
