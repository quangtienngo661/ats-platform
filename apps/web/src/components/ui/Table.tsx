import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from './cn';

export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>) {
    return (
        <div className="overflow-x-auto rounded-card bg-surface shadow-e1">
            <table className={cn('w-full border-collapse text-left text-body-sm text-ink-2', className)} {...rest} />
        </div>
    );
}

export function THead({ sticky, className, ...rest }: HTMLAttributes<HTMLTableSectionElement> & { sticky?: boolean }) {
    return <thead className={cn(sticky && 'sticky top-0 z-sticky bg-surface', className)} {...rest} />;
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody {...props} />;
}

export function TR({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
    return (
        <tr
            className={cn(
                'border-b border-line transition-colors duration-hover last:border-b-0 hover:bg-surface-2/60',
                className,
            )}
            {...rest}
        />
    );
}

export function TH({ numeric, className, ...rest }: ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
    return (
        <th
            scope="col"
            className={cn('h-9 px-3 text-caption font-medium text-ink-3', numeric && 'text-right tabular-nums', className)}
            {...rest}
        />
    );
}

export function TD({ numeric, className, ...rest }: TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
    return <td className={cn('px-3 py-2.5', numeric && 'text-right tabular-nums', className)} {...rest} />;
}
