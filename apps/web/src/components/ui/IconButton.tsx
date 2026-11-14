import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { iconButtonClasses, type IconButtonSize } from './Button';

export type IconButtonProps = ComponentPropsWithoutRef<'button'> & {
    /** Required: an icon alone has no name. */
    'aria-label': string;
    size?: IconButtonSize;
};

/** A square ghost button holding one icon (32 or 36 px). Its look comes from the `Button` builder. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
    { size = 'md', type = 'button', className, ...props },
    ref,
) {
    return <button ref={ref} type={type} className={iconButtonClasses({ size, className })} {...props} />;
});
