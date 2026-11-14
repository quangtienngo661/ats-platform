import { CircleAlert } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { cn } from './cn';

/**
 * What `Field` hands its control. `Input`, `Textarea`, `Select` and `Checkbox` accept every key, so spread it:
 * `{(f) => <Input {...f} />}`. A test makes tsc fail if a key is added that a control does not accept.
 */
export type FieldControl = { id: string; describedBy?: string; invalid: boolean; required: boolean };

export type FieldProps = {
    label: ReactNode;
    /** A constraint the user cannot guess (format, limit). */
    hint?: ReactNode;
    /** What went wrong and what to do. Marks the control invalid. */
    error?: ReactNode;
    /** Marks the control `required` and shows a `*` next to the label (hidden from the accessible name). */
    required?: boolean;
    className?: string;
    children: (control: FieldControl) => ReactNode;
};

/**
 * Wires a label, a hint and an error to one control by `id`, `aria-describedby` and `aria-invalid`.
 * The error is described first so a screen reader announces it before the hint.
 * Not a client component: the render-prop child may be passed from a server component.
 */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
    const id = useId();
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

    return (
        <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
            <div className="flex items-baseline gap-0.5">
                <label htmlFor={id} className="text-body-sm font-medium text-ink">
                    {label}
                </label>
                {/* Kept out of the label so the accessible name stays the plain label text. */}
                {required ? (
                    <span aria-hidden="true" className="text-body-sm text-danger">
                        *
                    </span>
                ) : null}
            </div>
            {children({ id, describedBy, invalid: Boolean(error), required: Boolean(required) })}
            {hint ? (
                <p id={hintId} className="text-caption text-ink-3">
                    {hint}
                </p>
            ) : null}
            {error ? (
                <p id={errorId} className="flex items-start gap-1.5 text-caption text-danger">
                    <CircleAlert aria-hidden="true" strokeWidth={1.75} className="mt-0.5 size-3 shrink-0" />
                    <span className="min-w-0 break-words">{error}</span>
                </p>
            ) : null}
        </div>
    );
}
