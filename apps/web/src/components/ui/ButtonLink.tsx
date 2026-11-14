import Link from 'next/link';
import type { ComponentPropsWithRef } from 'react';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './Button';

export type ButtonLinkProps = ComponentPropsWithRef<typeof Link> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
};

/** A `next/link` that looks exactly like `Button`. Use it for navigation, `Button` for actions. */
export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
    return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
