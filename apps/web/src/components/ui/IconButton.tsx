import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from './cn';

export type IconButtonProps = ComponentPropsWithoutRef<'button'> & {
    /** Required: an icon alone has no name. */
    'aria-label': string;
    size?: 'sm' | 'md';
};

const sizes = {
    sm: 'size-8 [&_svg]:size-4',
    md: 'size-9 [&_svg]:size-[18px]',
} as const;

/** A square ghost button holding one icon (32 or 36 px). */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
    { size = 'md', type = 'button', className, ...props },
    ref,
) {
    return (
        <button
            ref={ref}
            type={type}
            className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-ctl text-ink-2',
                'transition duration-press ease-out-expo hover:bg-ink/5 hover:text-ink active:scale-[.97]',
                'data-[state=open]:bg-ink/5 data-[state=open]:text-ink',
                'disabled:pointer-events-none disabled:text-ink-4 [&_svg]:shrink-0',
                sizes[size],
                className,
            )}
            {...props}
        />
    );
});
