import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
    return (
        <nav aria-label="Đường dẫn">
            <ol className="flex flex-wrap items-center gap-1 text-caption text-ink-3">
                {items.map((item, i) => {
                    const last = i === items.length - 1;
                    return (
                        <Fragment key={`${i}-${item.label}`}>
                            <li className="min-w-0">
                                {item.href && !last ? (
                                    <Link href={item.href} className="rounded-ctl hover:text-ink">
                                        {item.label}
                                    </Link>
                                ) : (
                                    <span aria-current={last ? 'page' : undefined} className={last ? 'text-ink' : undefined}>
                                        {item.label}
                                    </span>
                                )}
                            </li>
                            {!last && (
                                <li aria-hidden="true" className="flex">
                                    <ChevronRight size={14} strokeWidth={1.75} />
                                </li>
                            )}
                        </Fragment>
                    );
                })}
            </ol>
        </nav>
    );
}
