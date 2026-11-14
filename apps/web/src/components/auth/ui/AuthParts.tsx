'use client';

import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { Button, IconButton, Input, type ControlFieldProps } from '@/components/ui';
import { cn } from '@/components/ui/cn';

/** The heading and the one-line sub-line that open every auth form. */
export function AuthHeading({ title, description, className }: { title: string; description?: ReactNode; className?: string }) {
    return (
        <div className={cn('mb-6', className)}>
            <h1 className="text-heading text-ink">{title}</h1>
            {description ? <p className="mt-1 text-body-sm text-ink-3">{description}</p> : null}
        </div>
    );
}

/** A whole-form message from the server: announced to screen readers, never tied to one field. */
export function AuthAlert({ tone = 'danger', children }: { tone?: 'danger' | 'success'; children: ReactNode }) {
    return (
        <div
            role={tone === 'danger' ? 'alert' : 'status'}
            className={cn(
                'rounded-ctl px-3 py-2.5 text-body-sm',
                tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success',
            )}
        >
            {children}
        </div>
    );
}

/** The primary submit of a server-action form: busy while the action runs. */
export function AuthSubmit({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="lg" loading={pending} disabled={disabled} className="mt-1 w-full">
            {children}
        </Button>
    );
}

/** A hairline with a word in the middle. */
export function AuthDivider({ children = 'hoặc' }: { children?: ReactNode }) {
    return (
        <div className="flex items-center gap-3 text-caption text-ink-3">
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
            {children}
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </div>
    );
}

type PasswordInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'size' | 'type'> &
    ControlFieldProps & {
        /** Names the toggle when it is not the main password ("xác nhận"). */
        toggleSubject?: string;
    };

/** An `Input` with a show/hide toggle. Spread the `Field` control onto it like any other input. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
    { toggleSubject, className, ...props },
    ref,
) {
    const [shown, setShown] = useState(false);
    const subject = toggleSubject ? `mật khẩu ${toggleSubject}` : 'mật khẩu';
    return (
        <div className="relative">
            <Input ref={ref} size="lg" type={shown ? 'text' : 'password'} className={cn('pr-11', className)} {...props} />
            <IconButton
                size="sm"
                aria-label={`${shown ? 'Ẩn' : 'Hiện'} ${subject}`}
                aria-pressed={shown}
                onClick={() => setShown((value) => !value)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
            >
                {shown ? <EyeOff strokeWidth={1.75} /> : <Eye strokeWidth={1.75} />}
            </IconButton>
        </div>
    );
});
